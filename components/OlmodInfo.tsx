
import React from 'react';

const OlmodInfo: React.FC = () => {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#1a1a1a] to-black p-8 rounded border border-gray-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/40 text-xs font-mono font-bold px-2.5 py-0.5 rounded tracking-wider uppercase">
                                COMMUNITY NETCODE STANDARD
                            </span>
                            <span className="text-gray-500 font-mono text-xs">• v0.5.14 Active</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3 brand-font">
                            <span className="text-[#ff6600]">OLMOD</span> <span className="text-white">MULTIPLAYER</span>
                        </h1>
                        <p className="text-gray-300 font-mono text-sm max-w-2xl leading-relaxed">
                            OLMOD is the official community standard for playing Overload multiplayer. It replaces the vanilla networking with a robust community-maintained system featuring a custom server browser, join-in-progress, and critical netcode improvements. To play online today, you must use OLMOD.
                        </p>
                    </div>
                    <a
                        href="https://github.com/overload-development-community/olmod/releases/tag/v0.5.14"
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold py-3 px-6 rounded shadow-lg shadow-orange-900/20 transition-all transform hover:scale-105 flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download v0.5.14
                    </a>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Installation */}
                <section className="bg-[#111] border border-gray-800 p-6 rounded">
                    <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
                        <span className="text-[#ff6600]">01.</span> Installation
                    </h2>
                    <ol className="space-y-4 text-sm text-gray-400 font-mono list-decimal list-inside">
                        <li className="pl-2">
                            Unzip the <span className="text-gray-200">olmod package</span> into your main Overload directory.
                        </li>
                        <li className="pl-2">
                            This is the same folder containing <code className="bg-black px-1 py-0.5 rounded border border-gray-700 text-gray-300">Overload.exe</code> and <code className="bg-black px-1 py-0.5 rounded border border-gray-700 text-gray-300">Overload_Data</code>.
                        </li>
                        <li className="pl-2">
                            Run the game using <span className="text-white font-bold">olmod.exe</span> (or the equivalent script) instead of the standard launcher.
                        </li>
                    </ol>
                    <div className="mt-4 bg-[#1a1a1a] p-3 rounded border-l-2 border-green-500 text-xs text-gray-400">
                        <strong className="text-green-500 block mb-1">Verification:</strong>
                        Check the top-right corner of the Main Menu. You should see the OLMOD version banner if installed correctly.
                    </div>
                </section>

                {/* Playing Online */}
                <section className="bg-[#111] border border-gray-800 p-6 rounded">
                    <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
                        <span className="text-[#ff6600]">02.</span> Playing Online
                    </h2>
                    <div className="space-y-4 text-sm text-gray-400">
                        <p>To begin playing Overload online from within olmod:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Click <span className="text-white">"Play Multiplayer"</span></li>
                            <li>Click <span className="text-white">"Server Browser"</span></li>
                        </ul>
                        <div className="space-y-2 mt-4">
                            <p><strong className="text-white">Joining:</strong> If a match is running, simply click "Join".</p>
                            <p><strong className="text-white">Creating:</strong> Click "Create" on an empty server, configure settings, and click "Create Match". The IP will auto-fill.</p>
                        </div>
                        <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50 mt-4 text-xs">
                            <span className="text-blue-400 font-bold">Note:</span> Join-in-Progress (JIP) is enabled by default. Don't hesitate to join running matches!
                        </div>
                    </div>
                </section>

                {/* Advanced Features */}
                <section className="bg-[#111] border border-gray-800 p-6 rounded md:col-span-2">
                    <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
                        <span className="text-[#ff6600]">03.</span> Advanced Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">

                        {/* Password Protection */}
                        <div>
                            <h3 className="text-white font-bold mb-2">Password Protection</h3>
                            <p className="text-gray-400 mb-2">
                                To protect a match, append an underscore and password to the Server IP.
                            </p>
                            <div className="bg-black p-2 rounded border border-gray-700 font-mono text-xs text-gray-300 mb-2">
                                1.2.3.4_SuperSecret
                            </div>
                            <p className="text-gray-500 text-xs">
                                The browser will show a "Join (PW)" button. You must append the password manually when joining.
                            </p>
                        </div>

                        {/* Observer Mode */}
                        <div>
                            <h3 className="text-white font-bold mb-2">Observer Mode</h3>
                            <p className="text-gray-400 mb-2">
                                To spectate a match without participating:
                            </p>
                            <ul className="list-disc list-inside text-gray-400 text-xs space-y-1">
                                <li>Create a pilot named <span className="text-[#ff6600] font-mono">OBSERVER</span></li>
                                <li>Or <span className="text-[#ff6600] font-mono">OBSERVER_name</span></li>
                                <li>Join the game as normal.</li>
                            </ul>
                        </div>

                        {/* Manual IP */}
                        <div>
                            <h3 className="text-white font-bold mb-2">Manual Connection</h3>
                            <p className="text-gray-400 mb-2">
                                If you prefer not to use the browser:
                            </p>
                            <p className="text-gray-500 text-xs">
                                Go to <strong>Internet Match</strong> and paste the Server IP directly. Use this Tracker website to find active IPs.
                            </p>
                        </div>

                    </div>
                </section>

            </div>

            {/* Footer Links */}
            <div className="flex justify-center gap-6 mt-12">
                <a href="https://discord.com/invite/6dof" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#ff6600] transition-colors flex items-center gap-2">
                    <span>Join Overload Discord</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.43 13.43 0 0 0-1.044 2.152 18.64 18.64 0 0 0-4.62 0 13.425 13.425 0 0 0-1.045-2.152.074.074 0 0 0-.078-.037 19.786 19.786 0 0 0-4.885 1.515.072.072 0 0 0-.033.027C.533 9.025-.32 13.555.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.074.074 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                </a>
                <a href="https://github.com/olmod/olmod" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#ff6600] transition-colors flex items-center gap-2">
                    <span>View Project on GitHub</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                </a>
            </div>
            <p className="text-center text-xs text-gray-700 mt-8">
                Overload is a registered trademark of Revival Productions, LLC.
            </p>
        </div>
    );
};

export default OlmodInfo;
