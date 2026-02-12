import React, { useEffect, useState } from 'react';
import { Badge, User } from '../types';
import { subscribeToLeaderboard } from '../services/storage';

export const ProgressBar = ({ current, max, label }: { current: number, max: number, label?: string }) => (
    <div className="w-full">
        {label && <div className="flex justify-between text-xs mb-1 font-medium text-slate-500 dark:text-slate-400">
            <span>{label}</span>
            <span>{Math.floor((current/max)*100)}%</span>
        </div>}
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (current / max) * 100)}%` }}
            />
        </div>
    </div>
);

export const BadgeDisplay = ({ badges }: { badges: Badge[] }) => {
    if (badges.length === 0) return <div className="text-sm text-slate-400 italic">No badges earned yet. Keep learning!</div>;
    return (
        <div className="flex flex-wrap gap-2">
            {badges.map(b => (
                <div key={b.id} className="group relative cursor-help">
                    <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-full flex items-center justify-center text-xl shadow-sm">
                        {b.icon}
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-800 dark:bg-slate-700 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center shadow-lg">
                        <div className="font-bold">{b.name}</div>
                        <div>{b.description}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const Leaderboard = ({ user }: { user: User }) => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToLeaderboard((data) => {
            setUsers(data);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center">
                <span className="mr-2">🏆</span> Global Leaderboard
            </h3>
            <div className="space-y-3">
                {users.map((u, i) => {
                    const isMe = u.id === user.id;
                    const avatar = u.points > 1000 ? '🧙‍♂️' : u.points > 500 ? '🎓' : u.points > 100 ? '🚀' : '👤';
                    
                    return (
                        <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${isMe ? 'bg-primary/5 border border-primary/20 dark:bg-primary/10' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                            <div className="flex items-center gap-3">
                                <span className={`font-mono font-bold w-6 text-center ${i < 3 ? 'text-yellow-600 dark:text-yellow-500' : 'text-slate-400'}`}>
                                    #{i + 1}
                                </span>
                                <span className="text-xl">{avatar}</span>
                                <span className={`font-medium ${isMe ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {isMe ? `${u.name} (You)` : u.name}
                                </span>
                            </div>
                            <span className="font-bold text-slate-600 dark:text-slate-400 text-sm">{u.points} XP</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};