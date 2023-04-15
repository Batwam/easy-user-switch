#!/bin/bash
echo "Enter -s to install system wide, -c to recompile the schema"

cd "$(dirname "$0")/src"

extension="easyuserswitch@batwam.corp"
LOCAL_DIR="$HOME/.local/share/gnome-shell/extensions/$extension"
SYSTEM_DIR="/usr/share/gnome-shell/extensions/$extension"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$extension"

while getopts 'sc:' flag; do
    case "${flag}" in
        s) system_install=true;;
        c) compile_schema=true;;
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

cd $OLDPWD

#enable extension
gnome-extensions enable $extension

if [ "$XDG_SESSION_TYPE" = "x11" ]; then
	printf "\n\e[32mAll files copied. \nReloading the gnome-shell (shortcut Alt + F2, r) to load the extension.\n\n\e[0m"
	killall -3 gnome-shell
else
	printf "\n\e[32mAll files copied. \nPlease log out and log back in again to load the extension.\n\n\e[0m"
fi


journalctl --follow -o cat /usr/bin/gnome-shell GNOME_SHELL_EXTENSION_UUID=$extension
#journalctl --follow -o cat /usr/bin/gnome-shell



