import tornado
from handler import JsonHandler


class AdminRouteHandler(JsonHandler):
    @tornado.web.authenticated
    def get(self, path):
        if 'admin-route' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        if path == 'interface':
            self.render('admin/route_interface.html', title=self.application.title)
        elif path == 'supply':
            self.render('admin/route_supply.html', title=self.application.title)
        elif path == 'product-supply':
            self.render('admin/route_product_supply.html', title=self.application.title)
        elif path == 'user-supply':
            self.render('admin/route_user_supply.html', title=self.application.title)
        else:
            self.send_error(404)
