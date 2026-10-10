
-- Countries reference table
CREATE TABLE public.cultural_countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  flag TEXT,
  region TEXT,
  languages TEXT[],
  summary TEXT,
  history TEXT,
  customs TEXT,
  food TEXT,
  music TEXT,
  clothing TEXT,
  festivals TEXT,
  attractions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cultural_countries TO anon, authenticated;
GRANT ALL ON public.cultural_countries TO service_role;
ALTER TABLE public.cultural_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cultural countries are public" ON public.cultural_countries FOR SELECT USING (true);
CREATE POLICY "Admins manage countries" ON public.cultural_countries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Museums
CREATE TABLE public.cultural_museums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  country_code TEXT REFERENCES public.cultural_countries(code),
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cultural_museums TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cultural_museums TO authenticated;
GRANT ALL ON public.cultural_museums TO service_role;
ALTER TABLE public.cultural_museums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Museums are public" ON public.cultural_museums FOR SELECT USING (true);
CREATE POLICY "Users create own museums" ON public.cultural_museums FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update museums" ON public.cultural_museums FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete museums" ON public.cultural_museums FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.cultural_museum_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id UUID NOT NULL REFERENCES public.cultural_museums(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cultural_museum_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cultural_museum_items TO authenticated;
GRANT ALL ON public.cultural_museum_items TO service_role;
ALTER TABLE public.cultural_museum_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Museum items public" ON public.cultural_museum_items FOR SELECT USING (true);
CREATE POLICY "Owner adds items" ON public.cultural_museum_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.cultural_museums m WHERE m.id = museum_id AND m.owner_id = auth.uid()));
CREATE POLICY "Owner updates items" ON public.cultural_museum_items FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owner deletes items" ON public.cultural_museum_items FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

-- Recipes
CREATE TABLE public.cultural_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT REFERENCES public.cultural_countries(code),
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT[],
  steps TEXT[],
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cultural_recipes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cultural_recipes TO authenticated;
GRANT ALL ON public.cultural_recipes TO service_role;
ALTER TABLE public.cultural_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipes public" ON public.cultural_recipes FOR SELECT USING (true);
CREATE POLICY "Owner creates recipe" ON public.cultural_recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates recipe" ON public.cultural_recipes FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owner deletes recipe" ON public.cultural_recipes FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

-- Music
CREATE TABLE public.cultural_music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT REFERENCES public.cultural_countries(code),
  title TEXT NOT NULL,
  artist TEXT,
  audio_url TEXT,
  cover_url TEXT,
  instrument TEXT,
  kind TEXT DEFAULT 'song',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cultural_music_tracks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cultural_music_tracks TO authenticated;
GRANT ALL ON public.cultural_music_tracks TO service_role;
ALTER TABLE public.cultural_music_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Music public" ON public.cultural_music_tracks FOR SELECT USING (true);
CREATE POLICY "Owner creates track" ON public.cultural_music_tracks FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates track" ON public.cultural_music_tracks FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owner deletes track" ON public.cultural_music_tracks FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

-- Fashion
CREATE TABLE public.cultural_fashion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT REFERENCES public.cultural_countries(code),
  name TEXT NOT NULL,
  description TEXT,
  occasion TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cultural_fashion_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cultural_fashion_items TO authenticated;
GRANT ALL ON public.cultural_fashion_items TO service_role;
ALTER TABLE public.cultural_fashion_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fashion public" ON public.cultural_fashion_items FOR SELECT USING (true);
CREATE POLICY "Owner creates fashion" ON public.cultural_fashion_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates fashion" ON public.cultural_fashion_items FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owner deletes fashion" ON public.cultural_fashion_items FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

-- Oral stories
CREATE TABLE public.cultural_oral_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT REFERENCES public.cultural_countries(code),
  title TEXT NOT NULL,
  storyteller TEXT,
  audio_url TEXT,
  transcript TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cultural_oral_stories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cultural_oral_stories TO authenticated;
GRANT ALL ON public.cultural_oral_stories TO service_role;
ALTER TABLE public.cultural_oral_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stories public" ON public.cultural_oral_stories FOR SELECT USING (true);
CREATE POLICY "Owner creates story" ON public.cultural_oral_stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates story" ON public.cultural_oral_stories FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owner deletes story" ON public.cultural_oral_stories FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

-- Cultural groups (Facebook-style groups scoped to CulturalVerse)
CREATE TABLE public.cultural_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT REFERENCES public.cultural_countries(code),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cultural_groups TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cultural_groups TO authenticated;
GRANT ALL ON public.cultural_groups TO service_role;
ALTER TABLE public.cultural_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cultural groups public" ON public.cultural_groups FOR SELECT USING (true);
CREATE POLICY "Owner creates group" ON public.cultural_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates group" ON public.cultural_groups FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owner deletes group" ON public.cultural_groups FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.cultural_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.cultural_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
GRANT SELECT ON public.cultural_group_members TO anon, authenticated;
GRANT INSERT, DELETE ON public.cultural_group_members TO authenticated;
GRANT ALL ON public.cultural_group_members TO service_role;
ALTER TABLE public.cultural_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members public" ON public.cultural_group_members FOR SELECT USING (true);
CREATE POLICY "User joins group" ON public.cultural_group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User leaves group" ON public.cultural_group_members FOR DELETE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.cultural_groups g WHERE g.id = group_id AND g.owner_id = auth.uid()));

-- updated_at triggers
CREATE TRIGGER cultural_countries_updated_at BEFORE UPDATE ON public.cultural_countries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER cultural_museums_updated_at BEFORE UPDATE ON public.cultural_museums FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER cultural_recipes_updated_at BEFORE UPDATE ON public.cultural_recipes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER cultural_groups_updated_at BEFORE UPDATE ON public.cultural_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Group member count triggers
CREATE OR REPLACE FUNCTION public.update_cultural_group_member_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.cultural_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.cultural_groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER cultural_group_member_count_ins AFTER INSERT ON public.cultural_group_members FOR EACH ROW EXECUTE FUNCTION public.update_cultural_group_member_count();
CREATE TRIGGER cultural_group_member_count_del AFTER DELETE ON public.cultural_group_members FOR EACH ROW EXECUTE FUNCTION public.update_cultural_group_member_count();

-- Auto-add owner as member on group create
CREATE OR REPLACE FUNCTION public.handle_new_cultural_group()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.cultural_group_members (group_id, user_id, role) VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END $$;
CREATE TRIGGER cultural_group_owner_member AFTER INSERT ON public.cultural_groups FOR EACH ROW EXECUTE FUNCTION public.handle_new_cultural_group();

-- Seed countries
INSERT INTO public.cultural_countries (code, name, flag, region, languages, summary, customs, food, music, clothing, festivals, attractions) VALUES
('KE','Kenya','🇰🇪','Africa',ARRAY['Swahili','English','Kikuyu','Luo'],'Kenya is an East African nation known for savannah wildlife, the Great Rift Valley, and rich cultural diversity across 40+ ethnic groups.','Respect for elders, communal harambee spirit, extended family bonds, and vibrant storytelling traditions.','Ugali, nyama choma, sukuma wiki, pilau, mandazi, chapati, mukimo.','Benga, Genge, Bongo-Kenyan fusion, traditional Isukuti drums, Nyatiti lyre.','Kikoi, kanga, Maasai shuka, beaded jewelry.','Lamu Cultural Festival, Maulidi, Mombasa Carnival, Turkana Cultural Festival.','Maasai Mara, Mt Kenya, Diani Beach, Lamu Old Town, Lake Nakuru.'),
('TZ','Tanzania','🇹🇿','Africa',ARRAY['Swahili','English'],'Home to Kilimanjaro, Zanzibar spice islands, and the Serengeti — a cradle of Swahili culture.','Ujamaa community values, Swahili greetings (shikamoo), respect for elders.','Ugali, wali wa nazi, mishkaki, chapati, mandazi, zanzibar biryani.','Taarab, Bongo Flava, Ngoma drumming.','Kanga, kitenge, Maasai shuka.','Sauti za Busara, Mwaka Kogwa, Nyama Choma Festival.','Serengeti, Zanzibar, Kilimanjaro, Ngorongoro Crater.'),
('NG','Nigeria','🇳🇬','Africa',ARRAY['English','Yoruba','Igbo','Hausa'],'Africa''s most populous nation, blending Yoruba, Igbo, Hausa and 250+ ethnic cultures.','Naming ceremonies, extended family, respect via kneeling/prostrating.','Jollof rice, egusi, suya, pounded yam, akara.','Afrobeats, Fuji, Highlife, Juju.','Agbada, Buba, Iro and Buba, Aso Oke.','Eyo Festival, Osun-Osogbo, Argungu Fishing, Durbar.','Lekki, Yankari, Olumo Rock, Zuma Rock.'),
('US','United States','🇺🇸','Americas',ARRAY['English','Spanish'],'A federal republic of 50 states with immense cultural diversity from Indigenous, European, African, Asian and Latin American heritage.','Independence Day cookouts, Thanksgiving, road trips, melting pot values.','BBQ, burgers, apple pie, gumbo, tacos, soul food.','Jazz, Blues, Hip-Hop, Country, Rock ''n'' Roll.','Cowboy denim, Native American regalia, streetwear.','Mardi Gras, Thanksgiving, 4th of July, Coachella.','Grand Canyon, NYC, Yellowstone, New Orleans.'),
('IN','India','🇮🇳','Asia',ARRAY['Hindi','English','Bengali','Tamil','Telugu'],'A vast civilization with thousands of years of history, 22 official languages, and religions born on its soil.','Namaste greeting, touching elders'' feet, festivals of lights and colors.','Curry, biryani, dosa, samosa, dal, roti.','Hindustani, Carnatic, Bollywood, Bhangra.','Sari, kurta, dhoti, sherwani, lehenga.','Diwali, Holi, Eid, Pongal, Durga Puja.','Taj Mahal, Varanasi, Kerala, Jaipur, Himalayas.'),
('JP','Japan','🇯🇵','Asia',ARRAY['Japanese'],'An island nation blending ancient Shinto/Buddhist traditions with cutting-edge modern technology.','Bowing, seasonal awareness, tea ceremony, wa (harmony).','Sushi, ramen, tempura, miso, matcha, wagashi.','Gagaku, Enka, J-Pop, Taiko drumming.','Kimono, yukata, hakama.','Hanami, Gion Matsuri, Obon, Tanabata.','Kyoto temples, Mt Fuji, Tokyo, Nara.'),
('BR','Brazil','🇧🇷','Americas',ARRAY['Portuguese'],'South America''s largest country — home to the Amazon, Carnival, and a fusion of Indigenous, African and European cultures.','Warm greetings with hugs and cheek kisses, jeitinho, family focus.','Feijoada, pão de queijo, açaí, brigadeiro, moqueca.','Samba, Bossa Nova, Forró, Funk Carioca.','Baiana dress, capoeira white, carnival costumes.','Rio Carnival, Festa Junina, Bumba Meu Boi.','Rio de Janeiro, Amazon, Iguazu Falls, Salvador.'),
('EG','Egypt','🇪🇬','Africa',ARRAY['Arabic'],'Land of the Pharaohs and the Nile, cradle of one of the world''s oldest civilizations.','Hospitality (karam), extended family, respect for elders.','Koshari, ful medames, molokhia, taameya, kunafa.','Classical Arabic music, Shaabi, Mahraganat.','Galabeya, hijab, tarboush.','Ramadan, Sham El-Nessim, Wafaa El-Nil.','Pyramids of Giza, Luxor, Aswan, Nile cruises.'),
('CN','China','🇨🇳','Asia',ARRAY['Mandarin','Cantonese'],'A civilization spanning 5,000 years, 56 ethnic groups, and diverse regional cultures.','Filial piety, red for luck, tea culture, Lunar New Year.','Dumplings, Peking duck, hot pot, dim sum, noodles.','Peking Opera, Guqin, C-Pop.','Hanfu, Qipao/Cheongsam, Tang suit.','Spring Festival, Mid-Autumn, Dragon Boat, Lantern.','Great Wall, Forbidden City, Xi''an, Guilin.'),
('FR','France','🇫🇷','Europe',ARRAY['French'],'A European republic celebrated for art, cuisine, philosophy and revolutionary ideals.','La bise (cheek kisses), long meals, café culture.','Baguette, croissant, coq au vin, ratatouille, cheese.','Chanson, Musette, French electronic.','Haute couture, beret, Breton stripes.','Bastille Day, Fête de la Musique, Cannes.','Eiffel Tower, Louvre, Provence, Mont Saint-Michel.'),
('GB','United Kingdom','🇬🇧','Europe',ARRAY['English','Welsh','Gaelic'],'Union of England, Scotland, Wales and Northern Ireland with rich literary and musical traditions.','Queuing, tea time, pub culture, understatement.','Fish & chips, roast dinner, full English, scones.','Rock, Britpop, folk, bagpipes.','Kilt, Welsh national dress, morning suit.','Notting Hill Carnival, Edinburgh Fringe, Burns Night.','London, Edinburgh, Stonehenge, Lake District.'),
('DE','Germany','🇩🇪','Europe',ARRAY['German'],'Central European powerhouse with deep philosophical, musical, and engineering traditions.','Punctuality, direct communication, Sunday quiet.','Bratwurst, pretzel, sauerkraut, schnitzel, black forest cake.','Classical (Bach, Beethoven), Krautrock, Schlager.','Lederhosen, Dirndl.','Oktoberfest, Karneval, Christmas markets.','Berlin, Neuschwanstein, Black Forest, Rhine Valley.'),
('MX','Mexico','🇲🇽','Americas',ARRAY['Spanish'],'A vibrant Latin American nation blending Indigenous Mesoamerican and Spanish colonial heritage.','Family celebrations, sobremesa, warm hospitality.','Tacos, mole, tamales, chiles rellenos, guacamole.','Mariachi, Ranchera, Cumbia, Banda.','Charro suit, huipil, rebozo.','Día de los Muertos, Cinco de Mayo, Guelaguetza.','Chichén Itzá, Mexico City, Oaxaca, Tulum.'),
('ZA','South Africa','🇿🇦','Africa',ARRAY['Zulu','Xhosa','Afrikaans','English'],'The Rainbow Nation — 11 official languages and diverse cultures shaped by Indigenous, European, and Asian heritage.','Ubuntu philosophy, braai gatherings.','Braai, bobotie, biltong, pap, bunny chow.','Amapiano, Kwaito, Isicathamiya.','Shweshwe, Zulu beadwork, Ndebele patterns.','Cape Town Carnival, Reed Dance, Heritage Day.','Table Mountain, Kruger, Cape Winelands, Robben Island.'),
('ET','Ethiopia','🇪🇹','Africa',ARRAY['Amharic','Oromo','Tigrinya'],'One of the world''s oldest nations, birthplace of coffee and home to a unique calendar and script.','Coffee ceremony, injera-sharing, respect for elders.','Injera, doro wat, kitfo, shiro, tibs.','Ethio-jazz, Amharic pop, Krar and Masenqo.','Habesha kemis, netela, gabi.','Timkat, Meskel, Enkutatash, Genna.','Lalibela, Simien Mountains, Aksum, Danakil.'),
('MA','Morocco','🇲🇦','Africa',ARRAY['Arabic','Berber','French'],'North African kingdom where Berber, Arab, African and European cultures meet.','Mint tea hospitality, hammams, medina life.','Tagine, couscous, pastilla, harira, mint tea.','Gnawa, Andalusian, Chaabi, Raï.','Djellaba, kaftan, babouches.','Fantasia, Mawazine, Rose Festival.','Marrakech, Fez, Sahara, Chefchaouen.'),
('GH','Ghana','🇬🇭','Africa',ARRAY['English','Twi','Ewe','Ga'],'West African nation known for gold, kente cloth, and rich Akan traditions.','Naming days, chieftaincy, drumming and libation.','Jollof, banku, fufu, waakye, kelewele.','Highlife, Hiplife, Afrobeats, Kpanlogo drumming.','Kente, smock, batakari.','Homowo, Aboakyer, Panafest.','Cape Coast Castle, Kakum, Mole, Accra.'),
('SN','Senegal','🇸🇳','Africa',ARRAY['French','Wolof'],'West African republic famed for Teranga hospitality and vibrant music.','Teranga hospitality, extended family, Sufi brotherhoods.','Thieboudienne, yassa, mafé, ceebu jën.','Mbalax, Sabar drumming, Afro-Cuban fusion.','Boubou, kaftan.','Grand Magal, Saint-Louis Jazz.','Dakar, Gorée Island, Saly, Lac Rose.'),
('AU','Australia','🇦🇺','Oceania',ARRAY['English'],'Island continent with 60,000 years of Aboriginal heritage and modern multicultural society.','Mateship, laid-back humor, beach culture, Acknowledgement of Country.','BBQ, meat pie, Vegemite, lamingtons, pavlova.','Didgeridoo, country, indie rock.','Akubra hat, Driza-Bone, Aboriginal art motifs.','NAIDOC Week, Vivid Sydney, Australia Day.','Uluru, Sydney Opera House, Great Barrier Reef.'),
('AR','Argentina','🇦🇷','Americas',ARRAY['Spanish'],'South American nation of Pampas, tango, and passionate football.','Mate sharing, late dinners, family Sundays.','Asado, empanadas, dulce de leche, milanesa.','Tango, Folklore, Cumbia, Rock Nacional.','Gaucho attire, boina.','Carnaval de Gualeguaychú, Fiesta de la Vendimia.','Buenos Aires, Patagonia, Iguazu, Mendoza.');
