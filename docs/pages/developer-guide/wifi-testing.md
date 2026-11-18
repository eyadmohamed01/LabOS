---
title: Wi-Fi and LAN testing
---

# Wi-Fi and LAN testing

`make dev-wifi` starts the same development stack as `make dev`: hot reload, logs in the foreground, and `Ctrl+C` shutdown. It also detects a private IPv4 address and allows that host through the dev server and CORS.

```bash
make dev-wifi
```

The terminal prints both addresses, for example:

```text
Frontend:
  http://localhost:3000
  http://192.168.1.20:3000
Backend:
  http://localhost:8000
  http://192.168.1.20:8000
```

Open the LAN frontend URL on a phone, tablet, or another computer. The page's API helper uses the hostname you opened, so the device calls port 8000 on that same host.

The command does not edit `.env`. The override lasts for that process.

## If the address was not detected

The script checks a Windows Wi-Fi adapter when it is running under WSL, then local interfaces. If nothing looks like a private LAN address, it says so. Find the address yourself:

- Windows: `ipconfig`, use the IPv4 address of the Wi-Fi adapter.
- macOS: System Settings → Network, or `ipconfig getifaddr en0`.
- Linux: `ip -4 addr`.

Then open `http://<that-address>:3000`. You may also export the detected address by fixing network visibility and running `make dev-wifi` again.

An address in `172.16.0.0/12` under WSL is often the virtual adapter, not the Wi-Fi address other devices can route to. Prefer the `192.168.x.x` or `10.x.x.x` address from the host operating system.

## If the device cannot connect

- The phone and the computer must be on the same network. Guest Wi-Fi and "AP isolation" or "client isolation" block this on purpose.
- Allow inbound TCP **3000** and **8000**. On Windows, allow Docker Desktop through the firewall for private networks. On macOS, accept the incoming-connection prompt. On Linux, allow the ports in `ufw` or firewalld if a firewall is enabled.
- Turn off a VPN, then try again. Many VPN clients block LAN access.
- Corporate or campus Wi-Fi sometimes isolates clients even when the network name matches. A phone hotspot shared with the computer is a useful comparison test.
- Confirm the stack is still running. `make dev-wifi` is foreground-only. Closing the laptop lid or stopping the terminal stops the servers.

Hot reload still applies while this mode is running. A syntax error shows up in the same terminal.
