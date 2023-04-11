const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const {Gio,GLib,GObject,St,Gdm,AccountsService} = imports.gi;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();
const AuthPrompt = imports.gdm.authPrompt;
const LoginDialog = imports.gdm.loginDialog;

const Gettext = imports.gettext.domain('paneluserswitch');
const _ = Gettext.gettext;

let indicator = null;

function enable(){
	indicator = new PanelUserSwitch();
	Main.panel.addToStatusArea('paneluserswitch-menu', indicator);//added it so it shows in gdm too
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
		this._tty = [];
		let user_names = new Array();
		this._users.forEach((item) => {
		if (item.get_user_name() != GLib.get_user_name() && item.is_logged_in()) {
			this._items[item.get_real_name()] = item;
			this._tty[item.get_real_name()] = this._identifyTTY(item.get_user_name());;
			user_names.push(item.get_real_name());
			// log(Date().substring(16,24)+' fastuserswitch/src/extension.js: '+item.get_real_name()+' added');
		}
		});

		user_names.forEach((item) => {
			// let menu_item = new UserMenuItem(this._user_manager, this._items[item]);
			let menu_item = new PopupMenu.PopupMenuItem(item);
			let userName = this._items[item].get_user_name();
			// log(Date().substring(16,24)+' panel-user-switch/src/extension.js: '+userName+' now connected in tty'+this._tty[item]);

			menu_item.connect('activate', () => {
				if (this._tty[item] && this._items[item].is_logged_in()) {
					let tty = this._tty[item];
					try{
						this._runShell('sudo chvt '+tty); //switch to associated tty
					}
					catch(error){
						log(Date().substring(16,24)+' panel-user-switch/src/extension.js: '+error);
					}
				} 
				else {
					log(Date().substring(16,24)+' fastuserswitch/src/extension.js: '+userName+' not logged in, drop back to GDM login screen');
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
	
	_identifyTTY(userName){
		let output = this._runShell('w -hsf').split('\n');
		// log(Date().substring(16,24)+' panel-user-switch/src/extension.js - raw output: '+output.toString());

		output = output.filter(line => line.includes(userName)); //only retain devices just in case
		// log(Date().substring(16,24)+' panel-user-switch/src/extension.js - filtered by user: '+output.toString());
		
		if (output.length >0)
			return output[0].charAt(output[0].indexOf('tty') + 3);

		return;
	}
	_runShell(command){ 
		//run shell command
		//https://gjs.guide/guides/gio/subprocesses.html#communicating-with-processes
		let loop = GLib.MainLoop.new(null, false);
		let argument = GLib.shell_parse_argv(command)[1];
		let output = false;
		try {
			let proc = Gio.Subprocess.new(
				argument,
				Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
			);
		
			proc.communicate_utf8_async(null, null, (proc, res) => {
				try {
					let [, stdout, stderr] = proc.communicate_utf8_finish(res);
		
					if (proc.get_successful()) {
						// log('stdout: '+stdout);
						output = stdout;
					} else {
						throw new Error(stderr);
					}
				} catch (e) {
					logError(e);
				} finally {
					loop.quit();
				}
			});
		} catch (e) {
			logError(e);
		}
		loop.run();
		return output;
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

