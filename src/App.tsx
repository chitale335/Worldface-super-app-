import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CallProvider } from "@/contexts/CallContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CallOverlay } from "@/components/call/CallOverlay";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AppSplash } from "@/components/AppSplash";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import CreatePost from "./pages/CreatePost";
import HashtagPage from "./pages/HashtagPage";
import UserProfile from "./pages/UserProfile";
import Profile from "./pages/Profile";
import People from "./pages/People";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import Wallet from "./pages/Wallet";
import Payouts from "./pages/Payouts";
import PayoutAnalytics from "./pages/PayoutAnalytics";
import Rewards from "./pages/Rewards";
import NexaAI from "./pages/NexaAI";
import Payments from "./pages/Payments";
import Studio from "./pages/Studio";
import LiveStream from "./pages/LiveStream";
import LiveWatch from "./pages/LiveWatch";
import Founder from "./pages/Founder";
import Blog from "./pages/Blog";
import Landing from "./pages/Landing";
import Settings from "./pages/Settings";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import Music from "./pages/Music";
import MusicArtist from "./pages/MusicArtist";
import AppStore from "./pages/AppStore";
import AppDetail from "./pages/AppDetail";
import Marketplace from "./pages/Marketplace";
import AIAssistant from "./pages/AIAssistant";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import Communities from "./pages/Communities";
import CommunityNew from "./pages/CommunityNew";
import CommunityDetail from "./pages/CommunityDetail";
import CommunityPlans from "./pages/CommunityPlans";
import NotFound from "./pages/NotFound";
import CulturalVerseHub from "./pages/culturalverse/CulturalVerseHub";
import CulturalVerseMap from "./pages/culturalverse/CulturalVerseMap";
import CountryPage from "./pages/culturalverse/CountryPage";
import CulturalMentor from "./pages/culturalverse/CulturalMentor";
import Museums from "./pages/culturalverse/Museums";
import MuseumDetail from "./pages/culturalverse/MuseumDetail";
import Recipes from "./pages/culturalverse/Recipes";
import HeritageMusic from "./pages/culturalverse/HeritageMusic";
import Fashion from "./pages/culturalverse/Fashion";
import CulturalGroups from "./pages/culturalverse/CulturalGroups";
import CulturalGroupDetail from "./pages/culturalverse/CulturalGroupDetail";
import ComingSoon from "./pages/culturalverse/ComingSoon";
import AdsManager from "./pages/AdsManager";
import CreatorTools from "./pages/CreatorTools";
import BusinessTools from "./pages/BusinessTools";
import DeveloperTools from "./pages/DeveloperTools";
import CompanyProfile from "./pages/CompanyProfile";
import AiToolsCallback from "./pages/AiToolsCallback";
import { AiCoreDock } from "@/components/ai/AiCoreDock";
import { AppOpenAd } from "@/components/ads/AppOpenAd";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <CallProvider>
              <CallOverlay />
              <AppSplash />
              <OfflineBanner />
              <AppOpenAd />
              <AiCoreDock />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                <Route path="/tag/:tag" element={<ProtectedRoute><HashtagPage /></ProtectedRoute>} />
                <Route path="/u/:id" element={<UserProfile />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/company" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
                <Route path="/ai-tools/callback" element={<ProtectedRoute><AiToolsCallback /></ProtectedRoute>} />
                <Route path="/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/messages/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
                <Route path="/payouts/analytics" element={<ProtectedRoute><PayoutAnalytics /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
                <Route path="/ai" element={<ProtectedRoute><NexaAI /></ProtectedRoute>} />
                <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
                <Route path="/live" element={<ProtectedRoute><LiveStream /></ProtectedRoute>} />
                <Route path="/live/:streamId" element={<ProtectedRoute><LiveWatch /></ProtectedRoute>} />
                <Route path="/founder" element={<ProtectedRoute><Founder /></ProtectedRoute>} />
                <Route path="/blog" element={<ProtectedRoute><Blog /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/creator-tools" element={<ProtectedRoute><CreatorTools /></ProtectedRoute>} />
                <Route path="/business-tools" element={<ProtectedRoute><BusinessTools /></ProtectedRoute>} />
                <Route path="/developer-tools" element={<ProtectedRoute><DeveloperTools /></ProtectedRoute>} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/ads" element={<ProtectedRoute><AdsManager /></ProtectedRoute>} />
                <Route path="/music" element={<ProtectedRoute><Music /></ProtectedRoute>} />
                <Route path="/music/:id" element={<ProtectedRoute><MusicArtist /></ProtectedRoute>} />
                <Route path="/appstore" element={<ProtectedRoute><AppStore /></ProtectedRoute>} />
                <Route path="/appstore/:id" element={<ProtectedRoute><AppDetail /></ProtectedRoute>} />
                <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                <Route path="/assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
                <Route path="/news/:id" element={<ProtectedRoute><NewsArticle /></ProtectedRoute>} />
                <Route path="/communities" element={<ProtectedRoute><Communities /></ProtectedRoute>} />
                <Route path="/communities/new" element={<ProtectedRoute><CommunityNew /></ProtectedRoute>} />
                <Route path="/c/:slug" element={<ProtectedRoute><CommunityDetail /></ProtectedRoute>} />
                <Route path="/c/:slug/plans" element={<ProtectedRoute><CommunityPlans /></ProtectedRoute>} />
                <Route path="/culturalverse" element={<ProtectedRoute><CulturalVerseHub /></ProtectedRoute>} />
                <Route path="/culturalverse/map" element={<ProtectedRoute><CulturalVerseMap /></ProtectedRoute>} />
                <Route path="/culturalverse/country/:code" element={<ProtectedRoute><CountryPage /></ProtectedRoute>} />
                <Route path="/culturalverse/mentor" element={<ProtectedRoute><CulturalMentor /></ProtectedRoute>} />
                <Route path="/culturalverse/museums" element={<ProtectedRoute><Museums /></ProtectedRoute>} />
                <Route path="/culturalverse/museums/:id" element={<ProtectedRoute><MuseumDetail /></ProtectedRoute>} />
                <Route path="/culturalverse/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
                <Route path="/culturalverse/music" element={<ProtectedRoute><HeritageMusic /></ProtectedRoute>} />
                <Route path="/culturalverse/fashion" element={<ProtectedRoute><Fashion /></ProtectedRoute>} />
                <Route path="/culturalverse/groups" element={<ProtectedRoute><CulturalGroups /></ProtectedRoute>} />
                <Route path="/culturalverse/g/:slug" element={<ProtectedRoute><CulturalGroupDetail /></ProtectedRoute>} />
                <Route path="/culturalverse/stories" element={<ProtectedRoute><ComingSoon title="Oral History Archive" desc="Record and preserve elders' stories, tales, and proverbs." /></ProtectedRoute>} />
                <Route path="/culturalverse/live" element={<ProtectedRoute><ComingSoon title="Cultural Festival Live" desc="Livestream cultural events with real-time AI translation." /></ProtectedRoute>} />
                <Route path="/culturalverse/challenges" element={<ProtectedRoute><ComingSoon title="World Heritage Challenge" desc="Monthly cultural contests with community voting." /></ProtectedRoute>} />
                <Route path="/culturalverse/learn" element={<ProtectedRoute><ComingSoon title="Cultural Learning Center" desc="Short AI-assisted courses with digital certificates." /></ProtectedRoute>} />
                <Route path="/culturalverse/ambassadors" element={<ProtectedRoute><ComingSoon title="Cultural Ambassador Program" desc="Earn recognition and rewards for quality cultural content." /></ProtectedRoute>} />
                <Route path="/culturalverse/exchange" element={<ProtectedRoute><ComingSoon title="Cultural Exchange" desc="Connect with people worldwide to swap language and culture." /></ProtectedRoute>} />
                <Route path="/culturalverse/marketplace" element={<ProtectedRoute><ComingSoon title="Cultural Marketplace" desc="Artisans and craftspeople sell heritage items." /></ProtectedRoute>} />
                <Route path="/culturalverse/heritage-tree" element={<ProtectedRoute><ComingSoon title="Family Heritage Tree" desc="Build a digital family tree and preserve lineage." /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CallProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
