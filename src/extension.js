const {St,AccountsService,GLib,Gdm,GObject,Clutter} = imports.gi;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Gettext = imports.gettext.domain('fastuserswitch');
const _ = Gettext.gettext;

var FastUserSwitchMenu = GObject.registerClass(
	{GTypeName: 'FastUserSwitchMenu.FastUserSwitchMenu' },
 class FastUserSwitchMenu extends PanelMenu.Button{
  _init() {
    super._init(0.0, "Fast user switch");
    let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
    let icon = new St.Icon({ icon_name: 'system-users-symbolic',
                             style_class: 'system-status-icon' });
    hbox.add_child(icon);
    this.add_child(hbox);
    this.connect('button-press-event',this._onSwitchUserActivate.bind(this));
  }

  _onSwitchUserActivate() {
    Gdm.goto_login_session_sync(null);
  }
	
  _onDestroy() {
    if (this._user_manager_loaded_id) {
      this._user_manager_loaded_id = 0;
    }
    this.destroy();
  }
});

function init() {
  Convenience.initTranslations('fastuserswitch');
}

let _indicator;

function enable() {
  _indicator = new FastUserSwitchMenu();
  Main.panel.addToStatusArea('fastuserswitch-menu', _indicator);
}

function disable() {
  _indicator._onDestroy();
}