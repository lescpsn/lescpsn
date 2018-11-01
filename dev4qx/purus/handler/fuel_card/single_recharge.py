import tornado
from handler.fuel_card import FuelCardBaseHandler


class FuelCardSingleRechargeHandler(FuelCardBaseHandler):
    @tornado.web.authenticated
    def get(self):
        if 'fuel-card' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        return self.render('fuel_card/single_recharge.html', title=self.application.title)
