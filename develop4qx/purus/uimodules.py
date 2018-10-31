import tornado.web


class Sidebar(tornado.web.UIModule):
    def render(self, current_menu):
        roles = self.current_user['roles']

        return self.render_string(
            "section.sidebar.html", roles=roles, current_menu=current_menu)