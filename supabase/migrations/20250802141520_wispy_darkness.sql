/*
  # Update prop firms with commission-based cashback data

  1. Clear existing prop firms data
  2. Insert new prop firms with commission-based cashback
  3. Set cashback as 50% of affiliate commission
  4. Handle first-time vs recurring commission differences
  5. Add proper descriptions with discount messaging

  Note: Cashback percentages are calculated as 50% of the affiliate commission
*/

-- Clear existing prop firms
DELETE FROM prop_firms;

-- Insert CFD Prop Firms
INSERT INTO prop_firms (name, logo_url, description, affiliate_link, discount_percentage, cashback_percentage, category, is_first_time_offer, is_active) VALUES
('The5ers', 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400', 'Professional prop trading firm offering funded accounts for CFD trading. Get the highest discount from the website + cashback by purchasing from us.', 'http://www.the5ers.com?afmc=xe1', 0, 5.0, 'forex', true, true),

('FundingPips', 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400', 'Innovative prop trading firm with competitive funding solutions. Get the highest discount from the website + cashback by purchasing from us.', 'https://app.fundingpips.com/register?ref=3f9a7a40', 0, 2.5, 'forex', true, true),

('Maven', 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400', 'Advanced prop trading platform for professional traders. Get the highest discount from the website + cashback by purchasing from us.', 'https://maventrading.com/', 0, 0, 'forex', false, false),

('Brightfunded', 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400', 'Leading prop firm with excellent trader support and funding options. Get the highest discount from the website + cashback by purchasing from us.', 'https://brightfunded.com?affiliateId=sEAFXrFBT7-1aRkNqTKvg', 0, 5.0, 'forex', false, true),

('Blue Guardian', 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400', 'Trusted prop trading firm with transparent funding processes. Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.blueguardian.com/ref/73100/', 0, 5.0, 'forex', true, true),

('For Traders', 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400', 'Professional trading firm offering comprehensive funded account programs. Get the highest discount from the website + cashback by purchasing from us.', 'https://app.fortraders.com/trading/new-challenge?affiliateCode=GW8X8L3i3Y', 0, 5.0, 'forex', false, true),

('Instant Funding', 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400', 'Fast-track prop firm with instant funding solutions for qualified traders. Get the highest discount from the website + cashback by purchasing from us.', 'https://instantfunding.com/?partner=5959', 0, 7.5, 'forex', true, true),

('Aqua Funded', 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400', 'Premium prop trading firm with excellent profit sharing and support. Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.aquafunded.com/ref/4053/', 0, 7.5, 'forex', false, true),

('ThinkCapital', 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400', 'Innovative prop firm focused on trader development and success. Get the highest discount from the website + cashback by purchasing from us.', 'https://www.thinkcapital.com/', 0, 0, 'forex', false, false),

('PipFarm', 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400', 'Agricultural-themed prop firm with unique trading challenges. Get the highest discount from the website + cashback by purchasing from us.', 'https://pipfarm.com/', 0, 0, 'forex', false, false),

('Finotive Funding', 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400', 'Established prop firm with different rates for new and returning traders. Get the highest discount from the website + cashback by purchasing from us.', 'https://finotive.com/', 0, 2.5, 'forex', false, true),

('CFT', 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400', 'Crypto-focused prop trading firm with modern trading solutions. Get the highest discount from the website + cashback by purchasing from us.', 'https://cryptofundtrader.com?_by=propmate', 0, 5.0, 'forex', false, true),

('Breakout', 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400', 'Dynamic prop firm specializing in breakout trading strategies. Get the highest discount from the website + cashback by purchasing from us.', 'https://breakout.com/', 0, 0, 'forex', false, false),

('Seacrest Funded', 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400', 'Coastal-themed prop firm with comprehensive trader support. Get the highest discount from the website + cashback by purchasing from us.', 'https://seacrestfunded.com/', 0, 0, 'forex', false, false),

('Goat Funded Trader', 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400', 'Elite prop firm for top-tier traders seeking maximum funding. Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.goatfundedtrader.com/aff/propmate/', 0, 4.0, 'forex', false, true);

-- Insert Futures Prop Firms
INSERT INTO prop_firms (name, logo_url, description, affiliate_link, discount_percentage, cashback_percentage, category, is_first_time_offer, is_active) VALUES
('Blue Guardian Futures', 'https://images.pexels.com/photos/7567526/pexels-photo-7567526.jpeg?auto=compress&cs=tinysrgb&w=400', 'Premier futures prop trading firm with excellent trader development programs. Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.blueguardianfutures.com/ref/509/', 0, 8.0, 'futures', false, true),

('Aqua Futures', 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400', 'Professional futures trading firm with competitive profit splits and funding. Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.aquafutures.io/ref/233/', 0, 7.5, 'futures', false, true),

('Funding Ticks', 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400', 'Specialized futures prop firm focused on tick-by-tick trading excellence. Get the highest discount from the website + cashback by purchasing from us.', 'https://app.fundingticks.com/register?ref=610cf8fb', 0, 5.0, 'futures', false, true);

-- Insert special first-time offer for Finotive Funding
INSERT INTO prop_firms (name, logo_url, description, affiliate_link, discount_percentage, cashback_percentage, category, is_first_time_offer, is_active) VALUES
('Finotive Funding', 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=400', 'Established prop firm with special first-time customer rates. Get the highest discount from the website + cashback by purchasing from us.', 'https://finotive.com/', 0, 12.5, 'forex', true, true);