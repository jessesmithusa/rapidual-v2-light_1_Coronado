-- Rapidual seed — plans, Orange County routes, wardrobe samples.

insert into plans (tier, name, price, bags_per_week, features) values
  ('starter','Starter',89.00,1,
    array['1 bag / week','Wash · dry · fold','Weekly pickup + re-delivery','Skip anytime']),
  ('household','Household',149.00,2,
    array['2 bags / week','Wash · dry · fold','Priority route windows','Detergent & fold preferences','Skip + pause anytime']),
  ('premium','Premium',219.00,4,
    array['4 bags / week','Hang-dry & delicates care','Same-day turnaround windows','Wardrobe recommendations','Dedicated support']);

insert into routes (id, name, city, service_day, load_type, utilization, active_subscribers, parcel_stops, path) values
  ('oc-irvine-north','OC · Irvine North','Irvine',2,'dual',0.95,412,138,
    '[{"lat":33.6846,"lng":-117.8265},{"lat":33.6921,"lng":-117.8112},{"lat":33.7016,"lng":-117.7989},{"lat":33.7104,"lng":-117.8203}]'),
  ('oc-santaana-central','OC · Santa Ana Central','Santa Ana',3,'dual',0.94,506,171,
    '[{"lat":33.7455,"lng":-117.8677},{"lat":33.7512,"lng":-117.8541},{"lat":33.7398,"lng":-117.8423},{"lat":33.7321,"lng":-117.8602}]'),
  ('oc-tustin-legacy','OC · Tustin Legacy','Tustin',4,'laundry',0.89,287,64,
    '[{"lat":33.7458,"lng":-117.8261},{"lat":33.7361,"lng":-117.8157},{"lat":33.7287,"lng":-117.8294}]'),
  ('oc-newport-coast','OC · Newport Coast','Newport Beach',5,'dual',0.96,198,92,
    '[{"lat":33.6189,"lng":-117.9298},{"lat":33.6102,"lng":-117.9081},{"lat":33.6024,"lng":-117.8889}]'),
  ('oc-costamesa-westside','OC · Costa Mesa Westside','Costa Mesa',1,'dual',0.93,344,119,
    '[{"lat":33.6411,"lng":-117.9187},{"lat":33.6498,"lng":-117.9043},{"lat":33.6359,"lng":-117.8966}]');

insert into wardrobe_items (title, reason, category, partner, price_from) values
  ('Everyday Crew Tees (5-pack)','You wash basics most weeks','basics','Target',24.00),
  ('Wrinkle-resist Chinos','Pairs with your hang-dry preference','bottoms','Costco',34.00),
  ('Hypoallergenic Detergent Refill','Matches your detergent setting','care','Walmart',18.00),
  ('Performance Quarter-Zip','Cooler OC evenings ahead','outerwear','Best Buy',58.00);
