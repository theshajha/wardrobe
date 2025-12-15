/**
 * Festival Countdown Widget
 * Shows the next upcoming Indian festival with countdown and outfit tips
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getDaysUntilFestival, getUpcomingFestivals, type Festival } from '@/lib/festivals';
import { Calendar, ChevronRight, Palette, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

// Map common color names to CSS colors for visual swatches
const COLOR_MAP: Record<string, string> = {
  // Reds & Pinks
  'red': '#ef4444',
  'maroon': '#7f1d1d',
  'burgundy': '#6b1d1d',
  'rose': '#f43f5e',
  'pink': '#ec4899',
  'magenta': '#d946ef',
  'coral': '#f97316',

  // Oranges & Yellows
  'orange': '#f97316',
  'saffron': '#ff9933',
  'amber': '#f59e0b',
  'yellow': '#eab308',
  'mustard': '#ca8a04',
  'gold': 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
  'lemon': '#facc15',

  // Greens
  'green': '#22c55e',
  'emerald': '#10b981',
  'olive': '#65a30d',
  'teal': '#14b8a6',
  'mint': '#34d399',

  // Blues
  'blue': '#3b82f6',
  'navy': '#1e3a5a',
  'royal blue': '#2563eb',
  'sapphire': '#1d4ed8',
  'sky': '#0ea5e9',
  'peacock blue': '#0891b2',
  'light blue': '#7dd3fc',

  // Purples
  'purple': '#a855f7',
  'violet': '#8b5cf6',
  'lavender': '#c4b5fd',
  'plum': '#7c3aed',

  // Neutrals
  'white': '#ffffff',
  'cream': '#fef3c7',
  'beige': '#d6d3c0',
  'ivory': '#fffff0',
  'black': '#171717',
  'grey': '#737373',
  'gray': '#737373',
  'silver': 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',

  // Metallics
  'metallic': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fcd34d 100%)',

  // Special
  'tricolor': 'linear-gradient(180deg, #ff9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)',
  'any festive color': 'linear-gradient(135deg, #f43f5e 0%, #a855f7 50%, #3b82f6 100%)',
  'any color': 'linear-gradient(135deg, #f43f5e 0%, #eab308 25%, #22c55e 50%, #3b82f6 75%, #a855f7 100%)',
  'festive colors': 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 50%, #a855f7 100%)',
  'varies by day - yellow, green, grey, orange, white, red, blue, pink, purple': 'linear-gradient(90deg, #eab308, #22c55e, #737373, #f97316, #fff, #ef4444, #3b82f6, #ec4899, #a855f7)',
};

function getColorStyle(colorName: string): { background: string; needsBorder: boolean } {
  const lowerColor = colorName.toLowerCase();

  // Check for exact match
  if (COLOR_MAP[lowerColor]) {
    const bg = COLOR_MAP[lowerColor];
    return {
      background: bg,
      needsBorder: lowerColor === 'white' || lowerColor === 'cream' || lowerColor === 'ivory'
    };
  }

  // Check for partial match
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (lowerColor.includes(key) || key.includes(lowerColor)) {
      return {
        background: value,
        needsBorder: key === 'white' || key === 'cream' || key === 'ivory'
      };
    }
  }

  // Default: gradient for unknown colors
  return {
    background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
    needsBorder: false
  };
}

interface FestivalCountdownProps {
  maxDays?: number; // Only show if festival is within this many days
  showMultiple?: boolean; // Show multiple upcoming festivals
}

export function FestivalCountdown({ maxDays = 60, showMultiple = false }: FestivalCountdownProps) {
  const upcomingFestivals = getUpcomingFestivals(maxDays);

  if (upcomingFestivals.length === 0) {
    return null;
  }

  const festivalsToShow = showMultiple ? upcomingFestivals.slice(0, 3) : [upcomingFestivals[0]];

  return (
    <div className="space-y-3">
      {festivalsToShow.map((festival, index) => (
        <FestivalCard
          key={festival.id}
          festival={festival}
          isHighlighted={index === 0}
        />
      ))}
    </div>
  );
}

function FestivalCard({ festival, isHighlighted }: { festival: Festival; isHighlighted: boolean }) {
  const daysUntil = getDaysUntilFestival(festival);

  // Determine urgency level
  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;
  const isUrgent = daysUntil <= 7;
  const isApproaching = daysUntil <= 14;

  // Dynamic gradient based on urgency
  const gradientClass = isUrgent
    ? 'from-rose-500/20 via-pink-500/10 to-transparent border-rose-500/30'
    : isApproaching
      ? 'from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/30'
      : 'from-violet-500/15 via-purple-500/10 to-transparent border-violet-500/20';

  const accentColor = isUrgent
    ? 'text-rose-400'
    : isApproaching
      ? 'text-amber-400'
      : 'text-violet-400';

  return (
    <Card className={`bg-gradient-to-br ${gradientClass} border overflow-hidden`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Festival Emoji */}
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-4xl shadow-lg border border-white/10">
            {festival.emoji}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-xl leading-tight">{festival.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {festival.description}
                </p>
              </div>

              {/* Countdown Badge */}
              <div className={`flex-shrink-0 text-right ${accentColor}`}>
                {isToday ? (
                  <div className="flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-bold text-lg">Today!</span>
                  </div>
                ) : isTomorrow ? (
                  <span className="font-bold text-lg">Tomorrow</span>
                ) : (
                  <div className="text-center">
                    <span className="text-3xl font-black leading-none">{daysUntil}</span>
                    <span className="text-xs block opacity-70 mt-0.5">days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Outfit Tips - Enhanced */}
            {isHighlighted && festival.outfitTips && (
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground leading-relaxed">
                    {festival.outfitTips}
                  </p>
                </div>

                {/* Color Swatches */}
                {festival.colors && festival.colors.length > 0 && (
                  <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Palette className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium uppercase tracking-wider">Colors</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {festival.colors.slice(0, 5).map((color, i) => {
                        const { background, needsBorder } = getColorStyle(color);
                        const isGradient = background.includes('gradient');

                        return (
                          <div
                            key={i}
                            className={`
                              group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                              bg-white/5 hover:bg-white/10 transition-colors cursor-default
                            `}
                            title={color}
                          >
                            {/* Color Swatch */}
                            <div
                              className={`
                                w-4 h-4 rounded-full flex-shrink-0 shadow-sm
                                ${needsBorder ? 'ring-1 ring-white/30' : ''}
                              `}
                              style={{
                                background: isGradient ? background : background,
                                backgroundColor: !isGradient ? background : undefined,
                              }}
                            />
                            {/* Color Name */}
                            <span className="text-xs text-white/70 capitalize">
                              {color.length > 15 ? color.substring(0, 12) + '...' : color}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {isHighlighted && (
              <div className="flex items-center gap-2 mt-4">
                <Link to={`/outfits?occasion=${festival.occasionId}`}>
                  <Button size="sm" variant="secondary" className="h-9 text-sm gap-2">
                    <Calendar className="h-4 w-4" />
                    Plan Outfit
                  </Button>
                </Link>
                {festival.id && (
                  <Link to={`/guides/${festival.id.replace(/-2025$/, '')}-outfit-ideas`}>
                    <Button size="sm" variant="ghost" className="h-9 text-sm gap-1.5">
                      Style Guide
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Urgency Message */}
            {isUrgent && !isToday && isHighlighted && (
              <p className={`text-sm mt-3 ${accentColor} font-medium flex items-center gap-2`}>
                {daysUntil <= 3
                  ? <>⚡ Last minute! Plan your outfit now</>
                  : <>🔔 Coming up soon — time to prep your look</>}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for sidebar or smaller spaces
 */
export function FestivalCountdownCompact() {
  const festivals = getUpcomingFestivals(30);
  const nextFestival = festivals[0];

  if (!nextFestival) return null;

  const daysUntil = getDaysUntilFestival(nextFestival);
  const isUrgent = daysUntil <= 7;

  return (
    <Link
      to={`/outfits?occasion=${nextFestival.occasionId}`}
      className={`
        flex items-center gap-3 p-3 rounded-lg transition-colors
        ${isUrgent
          ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20'
          : 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
        }
      `}
    >
      <span className="text-2xl">{nextFestival.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{nextFestival.name}</p>
        <p className={`text-xs ${isUrgent ? 'text-rose-400' : 'text-amber-400'}`}>
          {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
