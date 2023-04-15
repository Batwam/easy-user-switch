#!/bin/bash
echo "Enter -s to install system wide, -c to recompile the schema"

cd "$(dirname "$0")/src"
# automatically generate name from metadata info
extension=$(cat metadata.json | grep uuid | awk '{print $2}' | tr -d '",')
LOCAL_DIR="$HOME/.local/share/gnome-shell/extensions/$extension"
SYSTEM_DIR="/usr/share/gnome-shell/extensions/$extension"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$extension"

while getopts 'scd:' flag; do
    case "${flag}" in
        s) system_install=true;;
        c) compile_schema=true;;
		d) debug_mode=true
    esac
done

#option for system wide install
if [ "$system_install" == true ]; then
	if [ "$EUID" -ne 0 ]; then
		echo "Please run as root"
		exit
	fi
	INSTALL_DIR=$SYSTEM_DIR
fi

#option to recompile the schema
if [ "$compile_schema" == true ]; then
	echo "compiling git schema..."
	glib-compile-schemas schemas/
fi

rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

printf "\e[32mCopying extension files to target directory:\n\e[0m"
cp -Rv ./* $INSTALL_DIR

#go back to original folder
cd $OLDPWD

#exit if run as root
if [ "$EUID" -ne 0 ]; then
	exit
fi

#enable extension
gnome-extensions enable $extension

if [ "$XDG_SESSION_TYPE" = "x11" ]; then
	printf "\n\e[32mAll files copied. \nReloading the gnome-shell (shortcut Alt + F2, r) to load the extension.\n\n\e[0m"
	
else
	printf "\n\e[32mAll files copied. \nPlease log out and log back in again to load the extension.\n\n\e[0m"
fi

if [ "$debug_mode" == true ]; then
	killall -3 gnome-shell
	journalctl --follow -o cat /usr/bin/gnome-shell GNOME_SHELL_EXTENSION_UUID=$extension
fi


