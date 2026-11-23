#!/usr/bin/env python3
"""Generate project/rts-gns3.gns3 (GNS3 2.2, file revision 9) for the RTS lab."""
import json, os, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "..", "project")
PROJECT_ID = "5e7a2c1d-0f4b-4c8e-9a61-2b3d4e5f6a70"

def nid(n):  # stable UUIDs
    return "5e7a2c1d-0f4b-4c8e-9a61-0000000000%02d" % n

NODES = [
    # name, idx, image, adapters, symbol, x, y
    ("victim", 1, "localhost/rts-victim:latest", 1, ":/symbols/classic/computer.svg", -420, -170),
    ("dns",    2, "localhost/rts-dns:latest",    1, ":/symbols/classic/server.svg",   -420,  110),
    ("sw-lan", 3, "localhost/rts-sw:latest",     4, ":/symbols/classic/ethernet_switch.svg", -170, -30),
    ("gw",     4, "localhost/rts-gw:latest",     2, ":/symbols/classic/firewall.svg",   80, -30),
    ("phish",  5, "localhost/rts-phish:latest",  1, ":/symbols/classic/server.svg",    330, -30),
]
LINKS = [  # (nodeA, ethA, nodeB, ethB)
    ("victim", 0, "sw-lan", 0),
    ("dns",    0, "sw-lan", 1),
    ("gw",     0, "sw-lan", 2),
    ("gw",     1, "phish",  0),
]

def node(name, idx, image, adapters, symbol, x, y):
    return {
        "compute_id": "local",
        "console": None,
        "console_auto_start": False,
        "console_type": "none",
        "custom_adapters": [],
        "first_port_name": None,
        "height": 59,
        "label": {
            "rotation": 0,
            "style": "font-family: TypeWriter;font-size: 10.0;font-weight: bold;fill: #000000;fill-opacity: 1.0;",
            "text": name, "x": None, "y": -25,
        },
        "locked": False,
        "name": name,
        "node_id": nid(idx),
        "node_type": "docker",
        "port_name_format": "Ethernet{0}",
        "port_segment_size": 0,
        "properties": {
            "adapters": adapters,
            "aux": None,
            "console_http_path": "/",
            "console_http_port": 80,
            "console_resolution": "1024x768",
            "environment": None,
            "extra_hosts": None,
            "extra_volumes": [],
            "image": image,
            "start_command": None,
            "usage": "Return to Sender lab node (%s). Shell: ./scripts/shell.sh %s" % (name, name),
        },
        "symbol": symbol,
        "template_id": None,
        "width": 65,
        "x": x, "y": y, "z": 1,
    }

def text(i, x, y, s, size=11, bold=False, color="#000000"):
    w = "bold" if bold else "normal"
    svg = ('<svg height="%d" width="%d"><text fill="%s" fill-opacity="1.0" '
           'font-family="Sans Serif" font-size="%d" font-weight="%s">%s</text></svg>'
           % (size * 2 * (s.count("\n") + 1), int(len(s) * size * 0.65) + 10, color, size, w, s))
    return {"drawing_id": "5e7a2c1d-0f4b-4c8e-9a61-1000000000%02d" % i, "locked": False,
            "rotation": 0, "svg": svg, "x": x, "y": y, "z": 2}

def rect(i, x, y, w, h, stroke, fill):
    svg = ('<svg height="%d" width="%d"><rect fill="%s" fill-opacity="0.35" height="%d" '
           'stroke="%s" stroke-width="2" stroke-dasharray="5,3" width="%d" /></svg>' % (h, w, fill, h, stroke, w))
    return {"drawing_id": "5e7a2c1d-0f4b-4c8e-9a61-1000000000%02d" % i, "locked": False,
            "rotation": 0, "svg": svg, "x": x, "y": y, "z": 0}

idmap = {n[0]: nid(n[1]) for n in NODES}
links = []
for i, (a, pa, b, pb) in enumerate(LINKS, 1):
    links.append({
        "filters": {},
        "link_id": "5e7a2c1d-0f4b-4c8e-9a61-2000000000%02d" % i,
        "link_style": {},
        "nodes": [
            {"adapter_number": pa, "node_id": idmap[a], "port_number": 0,
             "label": {"rotation": 0, "style": "font-family: TypeWriter;font-size: 10.0;font-weight: bold;fill: #000000;fill-opacity: 1.0;", "text": "eth%d" % pa, "x": 20, "y": 20}},
            {"adapter_number": pb, "node_id": idmap[b], "port_number": 0,
             "label": {"rotation": 0, "style": "font-family: TypeWriter;font-size: 10.0;font-weight: bold;fill: #000000;fill-opacity: 1.0;", "text": "eth%d" % pb, "x": 20, "y": 20}},
        ],
        "suspend": False,
    })

drawings = [
    rect(1, -480, -230, 470, 450, "#2B3A8C", "#DDE3F5"),
    rect(2, 230, -120, 220, 220, "#C8362A", "#F8DAD7"),
    text(3, -470, -265, "LAN 10.10.1.0/24", 13, True, "#2B3A8C"),
    text(4, 240, -155, "DMZ 10.10.2.0/24", 13, True, "#C8362A"),
    text(5, -470, -120, "10.10.1.10", 10),
    text(6, -470, 160, "10.10.1.53  dnsmasq (DNS filter)", 10),
    text(7, -205, 40, "Linux bridge br0", 10),
    text(8, 40, 40, "10.10.1.1 | 10.10.2.1\niptables firewall", 10),
    text(9, 300, 40, "10.10.2.66  nginx DEMO", 10),
    text(10, -480, -330, "Return to Sender - Layer 2: DNS filter + firewall (Group 2)", 15, True, "#2B3A8C"),
    text(11, -480, 250, "jne-paket-tertunda.example  |  filter OFF: 200 OK  |  filter ON: NXDOMAIN + DROP", 10, False, "#555555"),
]

topo = {
    "auto_close": True, "auto_open": False, "auto_start": False,
    "drawing_grid_size": 25, "grid_size": 75,
    "name": "rts-gns3",
    "project_id": PROJECT_ID,
    "revision": 9,
    "scene_height": 1000, "scene_width": 2000,
    "show_grid": False, "show_interface_labels": True, "show_layers": False,
    "snap_to_grid": False,
    "supplier": None,
    "topology": {"computes": [], "drawings": drawings, "links": links,
                 "nodes": [node(*n) for n in NODES]},
    "type": "topology",
    "variables": None,
    "version": "2.2.61",
    "zoom": 100,
}

os.makedirs(OUT_DIR, exist_ok=True)
path = os.path.join(OUT_DIR, "rts-gns3.gns3")
with open(path, "w") as f:
    json.dump(topo, f, indent=4, sort_keys=True)
# Portable project = zip with project.gns3 at the root.
with zipfile.ZipFile(os.path.join(OUT_DIR, "rts-gns3.gns3project"), "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("project.gns3", json.dumps(topo, indent=4, sort_keys=True))
print("wrote", path)
