#!/bin/sh
extension="paneluserswitch@batwam.corp"
DEFAULT_INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$extension"

if [ -d $DEFAULT_INSTALL_DIR ]; then
	rm -rf $DEFAULT_INSTALL_DIR
fi

mkdir -p $DEFAULT_INSTALL_DIR
cd "$(dirname "$0")/src"
printf "\e[32mCopying extension files to target directory:\n\e[0m"
cp -Rv ./* $DEFAULT_INSTALL_DIR

cd $OLDPWD

if [ $XDG_SESSION_TYPE = "x11" ]; then
	printf "\n\e[32mAll files copied. \nReloading the gnome-shell (shortcut Alt + F2, r) to load the extension.\n\n\e[0m"
	killall -3 gnome-shell
else
	printf "\n\e[32mAll files copied. \nPlease log out and log back in again to load the extension.\n\n\e[0m"
fi

journalctl --follow -o cat /usr/bin/gnome-shell GNOME_SHELL_EXTENSION_UUID=$extension




