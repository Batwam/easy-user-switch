'use strict';

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const {Gio,GLib,GObject,St,Gdm,AccountsService} = imports.gi;
const Mainloop = imports.mainloop;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const extensionSettings = ExtensionUtils.getSettings();
const DEBUG_MODE = extensionSettings.get_boolean ('debug-mode');

let indicator = null;

function enable(){
	indicator = new EasyUserSwitch();
	Main.panel.addToStatusArea('easyuserswitch-menu', indicator);//added it so it shows in gdm too
}

function disable(){
	indicator._disable();
	indicator.destroy();
	indicator = null;
}

var EasyUserSwitch = GObject.registerClass(
	{ GTypeName: 'EasyUserSwitch' },
class EasyUserSwitch extends PanelMenu.Button {
	_init(){
		super._init(0.0,'EasyUserSwitch',false);

		this.box = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
		this.add_child(this.box);
		
		let icon = new St.Icon({ icon_name: 'system-users-symbolic',
								style_class: 'system-status-icon' });
		this.box.add_child(icon);

		// this.connect('button-press-event',(_a, event) => this._updateMenu());
		this._users = [];

		this._user_manager = AccountsService.UserManager.get_default();
		if (!this._user_manager.is_loaded) {
			this._user_manager_loaded_id = 	this._user_manager.connect('notify::is-loaded',this._onUserManagerLoaded.bind(this));
		} 
		else {
			this._onUserManagerLoaded();
		}

		Main.panel.addToStatusArea('EasyUserSwitch',this,0,'right'); //position,panel_side
	}

	_updateMenu() {
		log(Date().substring(16,24)+' easy-user-switch/src/extension.js: '+'_updateMenu()');
		if(this.menu)
			this.menu.removeAll();

		this.menu.addAction(_('Settings'), () => ExtensionUtils.openPrefs());
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

		let sessionStatus = this._runShell('loginctl session-status');
		this._activeSession = sessionStatus.substring(0,sessionStatus.indexOf(' '));//keep number before fors space
		if (DEBUG_MODE)
			log(Date().substring(16,24)+' easy-user-switch/src/extension.js - loginctlInfo - Active session: '+JSON.stringify(this._activeSession));

		this._switch_user_item = new PopupMenu.PopupMenuItem(_("Login Screen"));
		this._switch_user_item.connect('activate', () => {
			if (extensionSettings.get_boolean ('lock-screen-on-switch')){
				this._lockActiveScreen();
				setTimeout(() => {//allow 500ms to lock before switching
					Gdm.goto_login_session_sync(null)
				}, 500);
			}
			else
				Gdm.goto_login_session_sync(null)
		});
		this.menu.addMenuItem(this._switch_user_item);

		let loginctl = JSON.parse(this._runShell('loginctl list-sessions -o json'));
		loginctl = loginctl.filter( element => element.seat == "seat0"); //only keep graphical users (exclude pihole, ...)
		let activeUser = GLib.get_user_name().toString();

		let loginctlInfo = loginctl.filter( element => element.user !== activeUser && element.user !== 'gdm'); //list of connected users
		if (DEBUG_MODE)
			log(Date().substring(16,24)+' easy-user-switch/src/extension.js - loginctlInfo - loginctlInfo: '+JSON.stringify(loginctlInfo));

		this._users = this._user_manager.list_users();
		this._users = this._users.filter( element => element.get_user_name() !== activeUser);

		if(Object.keys(this._users).length > 0){
			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

			this._users.forEach((activeUser) => {
				const username = activeUser.get_user_name();
				log(Date().substring(16,24)+' easy-user-switch/src/extension.js - username: '+username);
				let item = [];
				// item = loginctlInfo.findLast((element) => element.user == username);
				loginctlInfo.forEach((element) => { //will pick the last match in case of user listed multiple times
					if (element.user == username){
						item = element;
					}
				});

				if (DEBUG_MODE)
					log(Date().substring(16,24)+' panel-user-switch/src/extension.js: \u001b[32m'+item.user+' now connected in '+item.tty+' ('+item.session+')');

				let displayName = this._capitalize(item.user);
				if (DEBUG_MODE) //provide tty info in menu
					displayName =  displayName +' ('+item.tty+', session '+item.session+')';

				let menu_item = new PopupMenu.PopupMenuItem(displayName);

				menu_item.connect('activate', () => {
					this.menu.close();
					if (extensionSettings.get_boolean ('lock-screen-on-switch')){
						this._lockActiveScreen();
						setTimeout(() => { //allow 500ms to lock before switching
							this._switchTTY(item);
						}, 500);
					}
					else
						this._switchTTY(item);
				});
				this.menu.addMenuItem(menu_item);
			});
		}
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
						// if (DEBUG_MODE)
						// 	log(Date().substring(16,24)+' easy-user-switch/src/extension.js - stdout: \n'+stdout);
						output = stdout;
					} else {
						throw new Error(stderr);
					}
				} catch (err) {
					if (DEBUG_MODE)
						log(Date().substring(16,24)+' easy-user-switch/src/extension.js - _runShell() communicate error: '+err);

				} finally {
					loop.quit();
				}
			});
		} catch (err) {
			if (DEBUG_MODE)
				log(Date().substring(16,24)+' easy-user-switch/src/extension.js - _runShell() general error: '+err);
				
		}
		loop.run();
		return output;
	}

	_onUserManagerLoaded() {
		log(Date().substring(16,24)+' easy-user-switch/src/extension.js: '+'_onUserManagerLoaded()');
		this._updateMenu();
		this._user_manager.connect('user-is-logged-in-changed',()=>{
			log(Date().substring(16,24)+' easy-user-switch/src/extension.js: '+'user-is-logged-in-changed');
			this._updateMenu();
		});
	}

	_disable(){
		if(this.icon)
			this.box.remove_child(this.icon);

		if (this.label)
			this.box.remove_child(this.label);

		this.remove_child(this.box);
	}
	_capitalize(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	_lockActiveScreen(){
		log(Date().substring(16,24)+' easy-user-switch/src/extension.js: locking screen');
		// this._runShell('loginctl lock-session '+this._activeSession); //alaternative method to lock via shell command
		Main.overview.hide(); //leave overview mode first if activated
		Main.screenShield.lock(true); //lock screen
	}

	_switchTTY(item){
		const ttyNumber = item.tty.replace("tty","");//only keep number

		const SWITCH_METHOD = extensionSettings.get_string ('switch-method');
		if (DEBUG_MODE)
			log(Date().substring(16,24)+' easy-user-switch/src/extension.js - SWITCH_METHOD: '+SWITCH_METHOD);

		switch(SWITCH_METHOD){
			case 'chvt':
				if (DEBUG_MODE)
					log(Date().substring(16,24)+' easy-user-switch/src/extension.js - chvt: '+item.tty);

				let output = this._runShell('sudo chvt '+ttyNumber); //switch to associated tty
				
				if (output == false){
					if (DEBUG_MODE)
						log(Date().substring(16,24)+' easy-user-switch/src/extension.js - chvt command output: '+output);

					const icon = Gio.Icon.new_for_string('error-symbolic');
					const monitor = global.display.get_current_monitor(); //identify current monitor for OSD
					Main.osdWindowManager.show(monitor, icon, 'Please add your user to the /etc/sudoers file and allow \n running `chvt` command without password using \n\''+activeUser+' ALL=(ALL:ALL) NOPASSWD: /usr/bin/chvt*\'', null); //display error
				}
				break;

			case 'loginctl':
					if (DEBUG_MODE)
						log(Date().substring(16,24)+' easy-user-switch/src/extension.js - loginctl to '+item.user+' (session '+item.session+')');

					this._runShell('loginctl activate '+item.session); //switch to associated tty
					break;
		}
	}
});

