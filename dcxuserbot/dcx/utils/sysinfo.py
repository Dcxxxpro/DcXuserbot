"""Cross-platform host telemetry collection.

Every probe is individually guarded, so this works identically on bare
metal, VPS, Docker containers, AWS EC2, Heroku dynos and even Android
(Termux) — whatever data a host refuses to disclose simply shows "N/A".
"""

from __future__ import annotations

import asyncio
import getpass
import os
import platform
import shutil
import socket
import time
from dataclasses import dataclass, field

import psutil

from dcx import DCX_VERSION
from dcx.utils.format import humanbytes


@dataclass
class DiskInfo:
    mount: str
    total: str
    used: str
    percent: float


@dataclass
class SysReport:
    timestamp: float = 0.0
    hostname: str = "unknown"
    user: str = "unknown"
    os_name: str = "unknown"
    kernel: str = "unknown"
    distro: str = "unknown"
    arch: str = "unknown"
    container: str = "bare-metal"
    python: str = ""
    telethon: str = ""
    dcx_version: str = DCX_VERSION
    cpu_model: str = "unknown"
    cpu_cores: int = 0
    cpu_threads: int = 0
    cpu_freq: float = 0.0
    cpu_percent: float = 0.0
    load_avg: tuple[float, float, float] = (0.0, 0.0, 0.0)
    ram_total: str = "N/A"
    ram_used: str = "N/A"
    ram_percent: float = 0.0
    swap_total: str = "N/A"
    swap_percent: float = 0.0
    disks: list[DiskInfo] = field(default_factory=list)
    net_sent: str = "N/A"
    net_recv: str = "N/A"
    local_ip: str = "N/A"
    public_ip: str = "N/A"
    location: str = "N/A"
    isp: str = "N/A"
    gpu: str = "N/A"
    boot_time: str = "N/A"
    uptime: float = 0.0
    processes: int = 0
    temperature: str = "N/A"


def _read_first(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read()
    except OSError:
        return ""


def _pretty_distro() -> str:
    if os.name == "nt":  # pragma: no cover
        return " ".join(part for part in platform.win32_ver() if part)
    if platform.system() == "Darwin":  # pragma: no cover
        return f"macOS {platform.mac_ver()[0]}"
    for line in _read_first("/etc/os-release").splitlines():
        if line.startswith("PRETTY_NAME="):
            return line.split("=", 1)[1].strip().strip('"')
    return platform.system() or "Linux"


def _cpu_model() -> str:
    if platform.system() == "Darwin":  # pragma: no cover
        try:
            import subprocess

            out = subprocess.run(
                ["sysctl", "-n", "machdep.cpu.brand_string"],
                capture_output=True, text=True, timeout=3,
            )
            if out.returncode == 0 and out.stdout.strip():
                return out.stdout.strip()
        except Exception:
            pass
    if platform.system() == "Linux":
        cpuinfo = _read_first("/proc/cpuinfo")
        for preferred in ("model name", "hardware", "processor", "model"):
            for line in cpuinfo.splitlines():
                if line.lower().startswith(preferred) and ":" in line:
                    value = line.split(":", 1)[-1].strip()
                    if value and not value.isdigit():
                        return value
        for line in cpuinfo.splitlines():  # last resort: even numeric model
            if line.lower().startswith("model name") and ":" in line:
                return line.split(":", 1)[-1].strip()
    proc = platform.processor()
    return proc or platform.machine() or "unknown"


def _container_hint() -> str:
    if os.path.exists("/.dockerenv") or "kubepods" in _read_first("/proc/1/cgroup"):
        return "Docker/K8s"
    cgroup = _read_first("/proc/1/cgroup").lower()
    if "lxc" in cgroup:
        return "LXC"
    if os.environ.get("DYNO"):
        return "Heroku"
    if os.environ.get("REPL_ID"):
        return "Replit"
    if os.environ.get("TERMUX_VERSION") or "com.termux" in os.environ.get("PREFIX", ""):
        return "Termux"
    product = _read_first("/sys/class/dmi/id/product_name").strip()
    hints = {
        "amazon ec2": "AWS EC2", "google": "GCP", "virtualbox": "VirtualBox",
        "kvm": "KVM", "vmware": "VMware", "microsoft corporation": "Azure/Hyper-V",
        "qemu": "QEMU", "digitalocean": "DigitalOcean", "xen": "Xen",
    }
    for needle, label in hints.items():
        if needle in product.lower():
            return label
    return "bare-metal"


async def _gpu_name() -> str:
    nvidia = shutil.which("nvidia-smi")
    if not nvidia:
        return "N/A"
    try:
        proc = await asyncio.create_subprocess_exec(
            nvidia, "--query-gpu=name", "--format=csv,noheader",
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL,
        )
        out, _ = await asyncio.wait_for(proc.communicate(), timeout=3)
        name = out.decode(errors="ignore").strip().splitlines()
        return name[0].strip() if name else "N/A"
    except Exception:
        return "N/A"


def _local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"


async def _public_net() -> tuple[str, str, str]:
    from dcx.utils.http import get_json

    for url, build in (
        ("http://ip-api.com/json/?fields=status,query,isp,org,city,countryCode",
         lambda d: (d.get("query", "N/A"),
                    f"{d.get('city', '?')}, {d.get('countryCode', '?')}",
                    d.get("isp") or d.get("org") or "N/A")),
        ("https://ipinfo.io/json",
         lambda d: (d.get("ip", "N/A"),
                    f"{d.get('city', '?')}, {d.get('country', '?')}",
                    d.get("org", "N/A"))),
    ):
        try:
            data = await get_json(url, timeout=4)
            return build(data)
        except Exception:
            continue
    return "N/A", "N/A", "N/A"


async def collect(interval: float = 0.12) -> SysReport:
    """Gather a full snapshot of this host."""
    report = SysReport(timestamp=time.time())
    report.hostname = socket.gethostname() or "unknown"
    try:
        report.user = getpass.getuser()
    except Exception:
        report.user = os.environ.get("USER", "unknown")
    report.os_name = platform.system() or "unknown"
    report.kernel = platform.release() or "unknown"
    report.distro = _pretty_distro()
    report.arch = platform.machine() or "unknown"
    report.container = _container_hint()
    report.python = platform.python_version()
    try:
        import telethon

        report.telethon = telethon.__version__
    except Exception:
        report.telethon = "N/A"

    cpu_freq = None
    try:
        freq = psutil.cpu_freq()
        cpu_freq = freq.current / 1000 if freq else 0.0
    except Exception:
        cpu_freq = 0.0
    report.cpu_model = _cpu_model()
    report.cpu_cores = psutil.cpu_count(logical=False) or 0
    report.cpu_threads = psutil.cpu_count(logical=True) or 0
    report.cpu_freq = round(cpu_freq or 0.0, 2)
    report.cpu_percent = psutil.cpu_percent(interval=interval)
    try:
        report.load_avg = tuple(round(x, 2) for x in os.getloadavg())  # type: ignore[assignment]
    except (OSError, AttributeError):
        report.load_avg = (0.0, 0.0, 0.0)

    ram = psutil.virtual_memory()
    report.ram_total = humanbytes(ram.total)
    report.ram_used = humanbytes(ram.used)
    report.ram_percent = ram.percent
    swap = psutil.swap_memory()
    report.swap_total = humanbytes(swap.total)
    report.swap_percent = swap.percent

    seen: set[str] = set()
    for part in psutil.disk_partitions(all=False):
        if part.fstype.lower() in {"squashfs", "tmpfs", "devtmpfs", "overlay", ""} and part.mountpoint != "/":
            continue
        if part.mountpoint in seen:
            continue
        seen.add(part.mountpoint)
        try:
            usage = psutil.disk_usage(part.mountpoint)
        except OSError:
            continue
        report.disks.append(DiskInfo(part.mountpoint, humanbytes(usage.total),
                                     humanbytes(usage.used), usage.percent))
        if len(report.disks) >= 4:
            break
    if not report.disks:
        try:
            usage = psutil.disk_usage("/")
            report.disks.append(DiskInfo("/", humanbytes(usage.total),
                                         humanbytes(usage.used), usage.percent))
        except OSError:
            pass

    try:
        io = psutil.net_io_counters()
        report.net_sent = humanbytes(io.bytes_sent)
        report.net_recv = humanbytes(io.bytes_recv)
    except Exception:
        pass

    try:
        temps = psutil.sensors_temperatures()
        for entries in temps.values():
            if entries and getattr(entries[0], "current", None):
                report.temperature = f"{entries[0].current:.1f} °C"
                break
    except Exception:
        pass

    report.boot_time = time.strftime("%Y-%m-%d %H:%M", time.localtime(psutil.boot_time()))
    report.uptime = time.time() - psutil.boot_time()
    try:
        report.processes = len(psutil.pids())
    except Exception:
        report.processes = 0

    report.local_ip = _local_ip()
    report.public_ip, report.location, report.isp = await _public_net()
    report.gpu = await _gpu_name()
    return report


def summary_text(report: SysReport) -> str:
    """Compact caption used under the sysinfo dashboard image."""
    from dcx.utils.format import time_formatter

    return (
        "🖥️ **DcX Instance Telemetry**\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        f"• **Host:** `{report.hostname}` ({report.container})\n"
        f"• **Distro:** `{report.distro}`\n"
        f"• **CPU:** `{report.cpu_threads}T {report.cpu_percent}%` "
        f"• **RAM:** `{report.ram_used} / {report.ram_total}`\n"
        f"• **Uptime:** `{time_formatter(report.uptime)}`\n"
        f"• **IP:** `{report.public_ip}` — {report.location}"
    )
