import { useQuery } from '@tanstack/react-query';
import { getUserById } from '@/lib/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
    userId: string;
    name?: string; // Fallback name if fetching fails or while loading
    className?: string;
    showName?: boolean; // Option to display name next to avatar
}

export function UserAvatar({ userId, name, className, showName = false }: UserAvatarProps) {
    const { data: user, isLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => getUserById(userId),
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        enabled: !!userId,
    });

    const displayName = user?.fullName || name || 'User';
    const photoURL = user?.avatar || user?.photoURL;
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                <AvatarImage src={photoURL} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-secondary/20 text-secondary-foreground text-xs font-medium">
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        initials || <User className="h-4 w-4" />
                    )}
                </AvatarFallback>
            </Avatar>
            {showName && (
                <span className="text-sm font-medium leading-none truncate">
                    {displayName}
                </span>
            )}
        </div>
    );
}
