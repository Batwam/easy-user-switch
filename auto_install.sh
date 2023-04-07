#!/bin/sh
cd "$(dirname "$0")"
printf "\e[32mCopying extension files to target directory:\n\e[0m"
make local-install

if [ $XDG_SESSION_TYPE = "x11" ]; then
	printf "\n\e[32mAll files copied. \nReloading the gnome-shell (shortcut Alt + F2, r) to load the extension.\n\n\e[0m"
	killall -3 gnome-shell
else
	printf "\n\e[32mAll files copied. \nPlease log out and log back in again to load the extension.\n\n\e[0m"
fi

