/*
  # Implement exact cashback logic based on commission structure

  1. Clear existing prop firms data
  2. Add new prop firms with correct commission-based cashback
  3. Set cashback as 50% of commission values
  4. Handle first-time vs recurring commission logic
*/

-- Clear existing prop firms
DELETE FROM prop_firms;

-- Insert CFD/Forex Prop Firms
INSERT INTO prop_firms (name, logo_url, description, affiliate_link, discount_percentage, cashback_percentage, category, is_first_time_offer, is_active) VALUES
-- The5ers (10% commission, 0% recurring)
('The5ers', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'http://www.the5ers.com?afmc=xe1', 0, 5.0, 'forex', true, true),

-- FundingPips (5% commission, 0% recurring)
('FundingPips', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://app.fundingpips.com/register?ref=3f9a7a40', 0, 2.5, 'forex', true, true),

-- Maven (no commission data provided - skip)

-- Brightfunded (10% commission, 10% recurring)
('Brightfunded', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://brightfunded.com?affiliateId=sEAFXrFBT7-1aRkNqTKvg', 0, 5.0, 'forex', true, true),
('Brightfunded', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://brightfunded.com?affiliateId=sEAFXrFBT7-1aRkNqTKvg', 0, 5.0, 'forex', false, true),

-- Blue Guardian (10% commission, 0% recurring)
('Blue Guardian', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.blueguardian.com/ref/73100/', 0, 5.0, 'forex', true, true),

-- For Traders (10% commission, 10% recurring)
('For Traders', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://app.fortraders.com/trading/new-challenge?affiliateCode=GW8X8L3i3Y', 0, 5.0, 'forex', true, true),
('For Traders', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://app.fortraders.com/trading/new-challenge?affiliateCode=GW8X8L3i3Y', 0, 5.0, 'forex', false, true),

-- Instant Funding (15% commission, 0% recurring)
('Instant Funding', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://instantfunding.com/?partner=5959', 0, 7.5, 'forex', true, true),

-- Aqua Funded (15% commission, 15% recurring)
('Aqua Funded', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.aquafunded.com/ref/4053/', 0, 7.5, 'forex', true, true),
('Aqua Funded', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.aquafunded.com/ref/4053/', 0, 7.5, 'forex', false, true),

-- ThinkCapital (no commission data provided - skip)

-- PipFarm (no commission data provided - skip)

-- Finotive Funding (25% commission, 5% recurring)
('Finotive Funding', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', '#', 0, 12.5, 'forex', true, true),
('Finotive Funding', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', '#', 0, 2.5, 'forex', false, true),

-- CFT (10% commission, 10% recurring)
('CFT', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://cryptofundtrader.com?_by=propmate', 0, 5.0, 'forex', true, true),
('CFT', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://cryptofundtrader.com?_by=propmate', 0, 5.0, 'forex', false, true),

-- Breakout (no commission data provided - skip)

-- Seacrest Funded (no commission data provided - skip)

-- Goat Funded Trader (8% commission, 8% recurring)
('Goat Funded Trader', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.goatfundedtrader.com/aff/propmate/', 0, 4.0, 'forex', true, true),
('Goat Funded Trader', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.goatfundedtrader.com/aff/propmate/', 0, 4.0, 'forex', false, true);

-- Insert Futures Prop Firms
INSERT INTO prop_firms (name, logo_url, description, affiliate_link, discount_percentage, cashback_percentage, category, is_first_time_offer, is_active) VALUES
-- Blue Guardian Futures (16% commission, 16% recurring)
('Blue Guardian Futures', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.blueguardianfutures.com/ref/509/', 0, 8.0, 'futures', true, true),
('Blue Guardian Futures', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.blueguardianfutures.com/ref/509/', 0, 8.0, 'futures', false, true),

-- Aqua Futures (15% commission, 15% recurring)
('Aqua Futures', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.aquafutures.io/ref/233/', 0, 7.5, 'futures', true, true),
('Aqua Futures', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://checkout.aquafutures.io/ref/233/', 0, 7.5, 'futures', false, true),

-- Funding Ticks (10% commission, 10% recurring)
('Funding Ticks', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://app.fundingticks.com/register?ref=610cf8fb', 0, 5.0, 'futures', true, true),
('Funding Ticks', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=100&h=100&fit=crop&crop=center', 'Get the highest discount from the website + cashback by purchasing from us.', 'https://app.fundingticks.com/register?ref=610cf8fb', 0, 5.0, 'futures', false, true);