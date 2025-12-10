# ClubCalendar Event Tagging Guide

**For Event Organizers**

This guide explains how to tag events in Wild Apricot so they appear correctly in ClubCalendar filters.

---

## Quick Reference

When creating or editing an event in Wild Apricot, add tags in the **Tags** field. Use these formats:

| What You Want | Tag to Add |
|---------------|------------|
| Food-related event | `activity:food` |
| Wine event | `activity:wine` |
| Outdoor/hiking event | `activity:outdoors` |
| Arts & culture event | `activity:arts` |
| Games event | `activity:games` |
| Fitness event | `activity:fitness` |
| Social/happy hour | `activity:social` |
| Free event | `cost:free` |
| Under $25 | `cost:under-25` |
| Under $50 | `cost:under-50` |
| Good for new members | `newbie-friendly` |
| Open to public/guests | `public-event` |
| Beginner level | `level:beginner` |
| Indoor event | `indoor` |
| Outdoor event | `outdoor` |

---

## What's Automatic vs. Manual

### You DON'T Need to Tag (Automatic)

ClubCalendar figures these out automatically:

| Filter | How It's Determined |
|--------|---------------------|
| **Time of Day** | From event start time (morning/afternoon/evening) |
| **Weekend** | From event date |
| **Has Openings** | From registration count vs. limit |
| **Committee** | From event name prefix (e.g., "Happy Hikers:") |

### You DO Need to Tag (Manual)

These require you to add tags:

| Filter | Why Manual |
|--------|-----------|
| **Activity Type** | System can't reliably guess from event name |
| **Cost Category** | Price fields may vary; explicit is better |
| **Newbie-Friendly** | Only you know if event is good for new members |
| **Public Event** | Only you know if guests are welcome |
| **Skill Level** | Only you know the required experience |

---

## Tag Format Rules

### Use Lowercase

```
✓ activity:wine
✗ Activity:Wine
✗ ACTIVITY:WINE
```

### Use Hyphens, Not Spaces

```
✓ newbie-friendly
✗ newbie friendly
✗ newbie_friendly
```

### Use Category:Value for Structured Tags

```
✓ activity:hiking
✓ cost:under-25
✓ level:beginner
```

### Use Single Words for Simple Tags

```
✓ outdoor
✓ indoor
✓ newbie-friendly
```

---

## Complete Tag List

### Activity Types (`activity:`)

| Tag | Use For |
|-----|---------|
| `activity:food` | Dinners, lunches, cooking classes, restaurant outings |
| `activity:wine` | Wine tastings, vineyard tours, wine education |
| `activity:beer` | Brewery tours, beer tastings |
| `activity:outdoors` | Hiking, walking, nature activities |
| `activity:fitness` | Exercise classes, sports, active recreation |
| `activity:arts` | Theater, concerts, museums, galleries |
| `activity:games` | Board games, card games, trivia |
| `activity:books` | Book clubs, reading groups |
| `activity:travel` | Day trips, overnight travel |
| `activity:social` | Happy hours, mixers, general social |
| `activity:education` | Classes, lectures, learning |
| `activity:wellness` | Yoga, meditation, health topics |
| `activity:garden` | Gardening, plant-related activities |
| `activity:crafts` | Art projects, DIY, creative activities |

### Cost Categories (`cost:`)

| Tag | Use For |
|-----|---------|
| `cost:free` | No charge to attend |
| `cost:under-25` | Total cost under $25 |
| `cost:under-50` | Total cost $25-49 |
| `cost:under-100` | Total cost $50-99 |
| `cost:over-100` | Total cost $100+ |

**Note:** Use the total cost to the member, including any food/drinks they'll pay for.

### Skill/Experience Level (`level:`)

| Tag | Use For |
|-----|---------|
| `level:beginner` | No prior experience needed |
| `level:intermediate` | Some experience helpful |
| `level:advanced` | Significant experience required |

### Location Type

| Tag | Use For |
|-----|---------|
| `indoor` | Event is indoors |
| `outdoor` | Event is outdoors |

If an event is both (e.g., starts outdoors, moves inside), you can add both tags.

### Audience Tags

| Tag | Use For |
|-----|---------|
| `newbie-friendly` | Especially welcoming to new members |
| `public-event` | Non-members/guests can attend |
| `members-only` | Restricted to members |
| `couples` | Designed for couples |
| `singles-welcome` | Singles explicitly welcome |

---

## Examples

### Example 1: Morning Hike

**Event Name:** Happy Hikers: Coastal Bluff Trail

**Tags to Add:**
```
activity:outdoors, cost:free, newbie-friendly, outdoor, level:beginner
```

**What's Automatic:**
- Committee: `happy-hikers` (from name prefix)
- Time: `morning` (from 9am start time)
- Day: `weekend` (from Saturday date)
- Availability: `open` (from registration count)

### Example 2: Wine Dinner

**Event Name:** Wine Appreciation: Holiday Wine Dinner

**Tags to Add:**
```
activity:wine, activity:food, cost:under-100, indoor
```

**What's Automatic:**
- Committee: `wine-appreciation` (from name prefix)
- Time: `evening` (from 6pm start time)
- Availability: `limited` (from 3 spots remaining)

### Example 3: Public Game Night

**Event Name:** Games!: Family Board Game Night

**Tags to Add:**
```
activity:games, cost:free, newbie-friendly, public-event, indoor, level:beginner
```

**What's Automatic:**
- Committee: `games` (from name prefix)
- Time: `evening` (from 7pm start time)
- Day: `weekend` (from Friday date)
- Availability: `open` (from registration count)

---

## Adding Tags in Wild Apricot

1. Go to **Events** in WA admin
2. Click on the event to edit
3. Scroll to the **Tags** field
4. Type tags separated by commas
5. Click **Save**

**Screenshot location:** [Add screenshot of WA tags field here]

---

## Common Mistakes

### Wrong

```
Activity: Wine          ← Don't capitalize
activity : wine         ← No spaces around colon
activity_wine           ← Use colon, not underscore
wine                    ← Missing category prefix
```

### Right

```
activity:wine
```

---

## Questions?

If you're unsure what tags to use, ask yourself:

1. **What type of activity is this?** → `activity:` tag
2. **How much will it cost members?** → `cost:` tag
3. **Would a brand-new member feel comfortable?** → `newbie-friendly`
4. **Can non-members attend?** → `public-event`
5. **Is it indoors or outdoors?** → `indoor` or `outdoor`
6. **Does it require special skills?** → `level:` tag

When in doubt, fewer tags are better than wrong tags. The automatic tags handle the most important filters.

---

*This guide is for ClubCalendar v1.0*
