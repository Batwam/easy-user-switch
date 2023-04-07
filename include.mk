extension_id = $(PACKAGE)
extension_base = @batwam.corp
extension_version = $(VERSION)
shell_versions = 3.10

extension_url = http://github.com/Batwam/$(extension_id)
uuid = $(extension_id)$(extension_base)
gettext_domain = $(extension_id)

extensiondir = $(datadir)/gnome-shell/extensions/$(uuid)
