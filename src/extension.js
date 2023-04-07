const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const {Clutter,Gio,GLib,GObject,St,Gdm,AccountsService} = imports.gi;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();

let indicator = null;

function enable(){
	indicator = new FastUserSwitch();
}

function disable(){
	indicator._disable();
	indicator.destroy();
	indicator = null;
}

var FastUserSwitch = GObject.registerClass(
	{ GTypeName: 'FastUserSwitch' },
class FastUserSwitch extends PanelMenu.Button {
	_init(){
		super._init(0.0,'FastUserSwitch',false);

		// this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.fastuserswith'); //need to add schema to use

		this.box = new St.BoxLayout({
			x_align: Clutter.ActorAlign.FILL
		});
		this.add_child(this.box);

		this.label = new St.Label({
			text: "test",
			y_align: Clutter.ActorAlign.CENTER
		});
		this.box.add_child(this.label);

		this._buildMenu();
		this.connect('button-press-event',this._buildMenu.bind(this));

		Main.panel.addToStatusArea('FastUserSwitch',this,0,'right'); //position,panel_side

		this._refresh();
	}

	_buildMenu(){
		this.menu.removeAll(); //start by deleting everything

	  //settings shortcut:
		this.menu.addAction(_('Settings'), () => ExtensionUtils.openPrefs());
	}

	_refresh() {
		const REFRESH_RATE = 300;

		// this.player = this.players.pick();
		this._setText();
		this._setIcon();
		this._removeTimeout();

		this._timeout = Mainloop.timeout_add(REFRESH_RATE, this._refresh.bind(this));
		return true;
	}

	_setIcon(){
	// 	const ICON_PLACE = this.settings.get_string('show-icon');
	// 	const PLACEHOLDER = this.settings.get_string('button-placeholder');

	// 	if(this.icon){
	// 		this.box.remove_child(this.icon);
	// 		this.icon = null;
	// 	}

	// 	if(!ICON_PLACE || !this.player || this.label.get_text() == "" || this.label.get_text() == PLACEHOLDER)
	// 		return

	// 	this.icon = this.player.icon

	// 	if (this.icon != null | undefined){
	// 		if (ICON_PLACE == "right")
	// 			this.box.add_child(this.icon);
	// 		else if (ICON_PLACE == "left")
	// 			this.box.insert_child_at_index(this.icon,0);
	// 	}
	}

	_setText() {
	// 	try{
	// 		if(this.player == null || undefined)
	// 			this.label.set_text("")
	// 		else
	// 			this.label.set_text(buildLabel(this.players));
	// 	}
	// 	catch(err){
	// 		log("FastUserSwitch: " + err);
	// 		this.label.set_text("");
	// 	}
	}

	_removeTimeout() {
		if(this._timeout) {
			Mainloop.source_remove(this._timeout);
			this._timeout = null;
		}
	}

	_disable(){
		// if(this.icon)
		// 	this.box.remove_child(this.icon);

		this.box.remove_child(this.label);
		this.remove_child(this.box);
		this._removeTimeout();

		if (this._repositionTimeout){
			GLib.Source.remove(this._repositionTimeout);
			this._repositionTimeout = null;
		}
	}
});

