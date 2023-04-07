const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const {Clutter,Gio,GLib,GObject,St,Gdm,AccountsService} = imports.gi;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();
const AuthPrompt = imports.gdm.authPrompt;

const Gettext = imports.gettext.domain('paneluserswitch');
const _ = Gettext.gettext;

let indicator = null;

function enable(){
	indicator = new PanelUserSwitch();
}

function disable(){
	indicator._disable();
	indicator.destroy();
	indicator = null;
}

var PanelUserSwitch = GObject.registerClass(
	{ GTypeName: 'PanelUserSwitch' },
class PanelUserSwitch extends PanelMenu.Button {
	_init(){
		super._init(0.0,'PanelUserSwitch',false);

		this.box = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
		this.add_child(this.box);
		
		let icon = new St.Icon({ icon_name: 'system-users-symbolic',
								style_class: 'system-status-icon' });
		this.box.add_child(icon);

log(Date().substring(16,24)+' PanelUserSwitch/src/extension.js: '+'---------------------------');

		this._users = [];
		this._items = [];

		this._user_manager = AccountsService.UserManager.get_default();
		if (!this._user_manager.is_loaded) {
			this._user_manager_loaded_id = 	this._user_manager.connect('notify::is-loaded',this._onUserManagerLoaded.bind(this));
		} 
		else {
			this._onUserManagerLoaded();
		}

		Main.panel.addToStatusArea('PanelUserSwitch',this,0,'right'); //position,panel_side
	}

	_updateMenu() {
		this.menu.removeAll();
		this._items = [];
		let user_names = new Array();
		this._users.forEach((item) => {
		  if (item.get_user_name() != GLib.get_user_name() && item.is_logged_in()) {
			this._items[item.get_real_name()] = item;
			user_names.push(item.get_real_name());
			log(Date().substring(16,24)+' fastuserswitch/src/extension.js: '+item.get_real_name()+' added');
		}
		else {
			log(Date().substring(16,24)+' fastuserswitch/src/extension.js: '+item.get_real_name()+' excluded');
		}
		});
	
		user_names.forEach((item) => {
			// let menu_item = new UserMenuItem(this._user_manager, this._items[item]);
			let menu_item = new PopupMenu.PopupMenuItem(this._items[item].get_real_name());

			menu_item.connect('activate', () => {
				if (this._items[item].is_logged_in()) {
					log(Date().substring(16,24)+' fastuserswitch/src/extension.js: '+this._items[item].get_real_name()+' logged in, switching now');
					let gdmClient = new Gdm.Client();
					menu_item._authPrompt = new AuthPrompt.AuthPrompt(gdmClient, AuthPrompt.AuthPromptMode.UNLOCK_ONLY);
					menu_item._authPrompt.begin({ userName: this._items[item].get_user_name() });
				} 
				else {
					log(Date().substring(16,24)+' fastuserswitch/src/extension.js: '+this._items[item].get_real_name()+' not logged in, drop back to GDM login screen');
					// In case something is wrong, drop back to GDM login screen
					Gdm.goto_login_session_sync(null);
				}
			});
			
			this.menu.addMenuItem(menu_item);
		});
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this._switch_user_item = new PopupMenu.PopupMenuItem(_("Login Screen"));
		this._switch_user_item.connect('activate', this._onSwitchUserActivate.bind(this));
		this.menu.addMenuItem(this._switch_user_item);

		// this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		// this.menu.addAction(_('Settings'), () => ExtensionUtils.openPrefs());
	}

	_onSwitchUserActivate() {
		Gdm.goto_login_session_sync(null);
	}

	_onUserManagerLoaded() {
		this._users = this._user_manager.list_users();
		this._updateMenu();
		this._user_manager.connect('user-is-logged-in-changed',this._updateMenu.bind(this));
	}

	_disable(){
		if(this.icon)
			this.box.remove_child(this.icon);

		if (this.label)
			this.box.remove_child(this.label);

		this.remove_child(this.box);
	}
});

