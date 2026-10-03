import React from 'react';
import { ExternalLink, BookOpen, Code, Trophy, ShoppingCart, Map } from 'lucide-react';

const Resources: React.FC = () => {
    const categories = [
        {
            title: "Maps & Level Editor",
            icon: <Map className="w-5 h-5 text-[#ff6600]" />,
            links: [
                { title: "Overload Maps", url: "https://www.overloadmaps.com/", desc: "Main file repository" },
                { title: "OMDB - Overload Map Data Base", url: "https://www.omdb.net/index.php", desc: "Search engine for maps" },
                { title: "Overload Level Editor Source Code", url: "https://github.com/overload-development-community/OverloadLevelEditor", desc: "GitHub Repository" }
            ]
        },
        {
            title: "Mods & Tools",
            icon: <Code className="w-5 h-5 text-blue-400" />,
            links: [
                { title: "OLMod & Overload Maps Portal", url: "https://olmod.overloadmaps.com/", desc: "Mod download & gallery" },
                { title: "OLMod Source Code", url: "https://github.com/overload-development-community/olmod", desc: "GitHub Repository" },
                { title: "OCT - Overload Community Tool", url: "https://github.com/maestrodk/OCT", desc: "GitHub Repository" },
                { title: "OLMod Audio Taunts Guide", url: "https://github.com/overload-development-community/olmod/wiki/Audio-taunts", desc: "Wiki Documentation" }
            ]
        },
        {
            title: "Competitive Play & Statistics",
            icon: <Trophy className="w-5 h-5 text-yellow-500" />,
            links: [
                { title: "Overload Team League (OTL)", url: "https://otl.gg/", desc: "Community League" },
                { title: "OTL Tracker", url: "https://tracker.otl.gg/", desc: "Stats & Leaderboards" }
            ]
        },
        {
            title: "Official Store Links",
            icon: <ShoppingCart className="w-5 h-5 text-green-500" />,
            links: [
                { title: "Buy Overload on Steam", url: "https://store.steampowered.com/app/448850/Overload/", desc: "Steam Store" },
                { title: "Buy Overload on GOG", url: "https://www.gog.com/en/game/overload", desc: "GOG Store" }
            ]
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Community Resources</h1>
                    <p className="text-gray-400">Essential links, tools, and documentation for the Overload community.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map((cat, idx) => (
                    <div key={idx} className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
                        <div className="p-4 border-b border-gray-800 bg-[#161616] flex items-center gap-3">
                            {cat.icon}
                            <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">{cat.title}</h3>
                        </div>
                        <div className="divide-y divide-gray-800/50">
                            {cat.links.map((link, lIdx) => (
                                <a
                                    key={lIdx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-gray-300 group-hover:text-[#ff6600] transition-colors">{link.title}</span>
                                        <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-white" />
                                    </div>
                                    <div className="text-sm text-gray-500 font-mono">{link.desc}</div>
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center text-xs text-gray-600 mt-12 bg-[#0e0e0e] p-6 rounded border border-gray-900">
                <p>These resources are maintained by the community.</p>
                <p>To suggest additions, please contact the dashboard administrator.</p>
            </div>
        </div>
    );
};

export default Resources;
