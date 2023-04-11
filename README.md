# Gnome Panel User Switch

Gnome-shell extension to easily switch between connected users
This is a fork of https://github.com/HROMANO/fastuserswitch

# Install

1. To install the extension locally (ie ~/.local/share/gnome-shell/extensions/): `./auto_install.sh`
2. add you users to the sudoers list for chvrt without password: `echo $(find /home -maxdepth 1 -printf '%u,' | sed 's/root,//g' | sed 's/.$//')"  ALL=(ALL:ALL) NOPASSWD: /usr/bin/chvt*" | sudo tee /etc/sudoers.d/10-panel-user-switch`
3. Restart gnome-shell, using <kbd>Alt</kbd>+<kbd>F2</kbd> then `r`+<kbd>Enter</kbd> with Xorg or logout/login with Wayland.
4. Enable the extension `gnome-extensions enable paneluserswitch@batwam.corp`

## Extras

- Enable an extension for all users (machine-wide)

    See https://help.gnome.org/admin/system-admin-guide/stable/extensions-enable.html.en
