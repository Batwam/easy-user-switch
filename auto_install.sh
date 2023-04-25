#!/bin/bash
echo "Enter flags: [s] to install system wide, [c] to recompile the schema, [d] debug mode"

cd "$(dirname "$0")/src"
# automatically generate name from metadata info
extension=$(cat metadata.json | grep uuid | awk '{print $2}' | tr -d '",')
LOCAL_DIR="$HOME/.local/share/gnome-shell/extensions/$extension"
SYSTEM_DIR="/usr/share/gnome-shell/extensions/$extension"

while getopts 'scd' flag; do
    case "${flag}" in
        s)
			system_install=true;;
        c)
			compile_schema=true;;
		d)
			debug_mode=true; echo "debug mode on";;
    esac
done

#option for system wide install
INSTALL_DIR="$LOCAL_DIR"
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
if [ "$EUID" -eq 0 ]; then
	exit
fi

#enable extension
gnome-extensions enable $extension

if [ "$XDG_SESSION_TYPE" = "x11" ]; then
	printf "\n\e[32mAll files copied. \nReloading the gnome-shell (shortcut Alt + F2, r) to load the extension.\n\n\e[0m"
	killall -3 gnome-shell
	gnome-extensions enable $extension
else
	printf "\n\e[32mAll files copied. \nPlease log out and log back in again to load the extension.\n\n\e[0m"
fi
echo "debug_mode:$debug_mode"
if [ "$debug_mode" == true ]; then
	journalctl --follow -o cat /usr/bin/gnome-shell GNOME_SHELL_EXTENSION_UUID=$extension
fi


