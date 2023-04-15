'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function init() {
}

function fillPreferencesWindow(window) {
    // Use the same GSettings schema as in `extension.js`
    const systemSettings = ExtensionUtils.getSettings('org.gnome.desktop.screensaver');
    const extensionSettings = ExtensionUtils.getSettings('org.gnome.shell.extensions.easy-user-switch');

    // Create a preferences page and group
    let page;
    let group;
    let row;
	let button;
    let toggle;

    page = new Adw.PreferencesPage(); 

    group = new Adw.PreferencesGroup({ title: 'System Preferences'});
    // group.set_description('Update relevant System Preferences');
    page.add(group);

    // Create a new preferences row
    row = new Adw.ActionRow({ title: 'Automatic Screen Lock' });
    row.subtitle = "Disable to prevent session from locking due to inactivity"
    group.add(row);

    // Create the switch and bind its value to the `show-indicator` key
    toggle = new Gtk.Switch({
        active: systemSettings.get_boolean ('lock-enabled'),
        valign: Gtk.Align.CENTER,
    });
    systemSettings.bind('lock-enabled',toggle,'active',Gio.SettingsBindFlags.DEFAULT);

    // Add the switch to the row
    row.add_suffix(toggle);
    row.activatable_widget = toggle;

    //Extension Preferences
    group = new Adw.PreferencesGroup({ title: 'Extension Preferences'});
    // group.set_description('Update Extension Preferences');
    page.add(group);

    row = new Adw.ActionRow({ title: 'Lock session before switching' });
    row.subtitle = "Enable to require password when switching back"
    group.add(row);

    // Create the switch and bind its value to the key
    toggle = new Gtk.Switch({
        active: extensionSettings.get_boolean ('lock-screen-on-switch'),
        valign: Gtk.Align.CENTER,
    });
    extensionSettings.bind('lock-screen-on-switch',toggle,'active',Gio.SettingsBindFlags.DEFAULT);

    // Add the switch to the row
    row.add_suffix(toggle);
    row.activatable_widget = toggle;
    page.add(group);

    //add empty row
    group = new Adw.PreferencesGroup({ title: ' ' });
    page.add(group);

	button = new Gtk.Button({
		label: `Reset Settings to Defaults`,
		visible: true
	});
	button.connect('clicked',() => this.resetSettings());
    group.add(button);

    // Add our page to the window
    window.add(page);
}

function resetSettings(){
    const systemSettings = ExtensionUtils.getSettings('org.gnome.desktop.screensaver');
    // systemSettings.reset('lock-enabled');
    systemSettings.set_boolean('lock-enabled',false);

    const extensionSettings = ExtensionUtils.getSettings('org.gnome.shell.extensions.easy-user-switch');
    extensionSettings.reset('lock-screen-on-switch');
}

function addEmptyRow(page){
    const group = new Adw.PreferencesGroup();
    group.set_title(' ');
    page.add(group);
}