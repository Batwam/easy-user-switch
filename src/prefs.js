'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const systemSettings = ExtensionUtils.getSettings('org.gnome.desktop.screensaver');

function init() {
}

function fillPreferencesWindow(window) {
    // Use the same GSettings schema as in `extension.js`
    // const extensionSettings = Me.getSettings('org.gnome.shell.extensions.example');
    
    
    // Create a preferences page and group
    const page = new Adw.PreferencesPage();

    let group;
    let row;

    group = new Adw.PreferencesGroup();
    group.set_title('System Preferences');
    group.set_description('Update selected System Preferences');
    page.add(group);

    // Create a new preferences row
    row = new Adw.ActionRow({ title: 'Automatic Screen Lock' });
    row.subtitle = "Disable to allow switching to this Session without retyping the password"
    group.add(row);

    // Create the switch and bind its value to the `show-indicator` key
    const toggle = new Gtk.Switch({
        active: systemSettings.get_boolean ('lock-enabled'),
        valign: Gtk.Align.CENTER,
    });
    systemSettings.bind('lock-enabled',toggle,'active',Gio.SettingsBindFlags.DEFAULT);

    // Add the switch to the row
    row.add_suffix(toggle);
    row.activatable_widget = toggle;

    //add empty row
    group = new Adw.PreferencesGroup();
    page.add(group);

	let button;
    
    button = new Gtk.Button({
		label: `Reset to System Defaults`,
		visible: true
	});
	button.connect('clicked',() => this.resetDefaultSettings());
    group.add(button);

    //add empty row
    group = new Adw.PreferencesGroup();
    page.add(group);

	button = new Gtk.Button({
		label: `Reset to Recommended Defaults`,
		visible: true
	});
	button.connect('clicked',() => this.resetRecommendedSettings());
    group.add(button);

    // Add our page to the window
    window.add(page);
}

function resetDefaultSettings(){
    systemSettings.reset('lock-enabled');
}

function resetRecommendedSettings(){
    systemSettings.set_boolean('lock-enabled',false);
}

function addEmptyRow(page){
    const group = new Adw.PreferencesGroup();
    group.set_title(' ');
    page.add(group);
}