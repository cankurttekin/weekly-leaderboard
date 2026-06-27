# Requirements Document

## 1. Context
- Idle/clicker mobile game: **10M+ registered players, ~2M DAU**. 
- Players earn in-game currency, weekly leaderboard resets Monday. Old system is slow redesign and rebuild from scratch.

## 2. Mandated Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js (TypeScript) |
| Frontend | React (TypeScript) |
| Relational DB | PostgreSQL |
| Cache/Live ranking | Redis |
| Archive/Analytics | MongoDB |
| Cloud | AWS |

* Client and server code should be in separate projects

## 3. Functional Requirements
**Prize Pool:**
- 2% of ALL weekly earnings goes to prize pool.
- Each week, the top 100 players receive a share of the prize pool:
  * 1st place: 20%
  * 2nd place: 15%
  * 3rd place: 10%
  * Players ranked 4th through 100th share the remaining 55% weighted by rank.
- Pool and leaderboard resets after distribution.

**Leaderboard UI:**
- Top 100 always visible.
- Even player not in top 100 show own rank and 3 above and 2 below.
- Easily compare themselves with others.
- Responsive.
-- We expect you to think about how you’ll handle the interactions that make the list easier to explore, the opportunities for global comparison, and the weekly reward/status communication. Don’t forget to include sample data so we can test it — any creative touches beyond that are yours to make.

**System:**
- Scalable
- High Performance
- Reusable React components
- Stateless architecture
- Instant loading

### Evaluation
- Scenario fit, tech use, scalability, performance, code quality, cloud usage, reusable components.
- **AI workflow documentation** showing *how* you used AI, not just *that* you used it.
- Deployed production build with seed data.



#### Reference - Original Document:

You are responsible for designing a leaderboard system that integrates into an existing backend stack. The system runs on Node.js, PostgreSQL, MongoDB and Redis. Your implementation must stay within this stack.

Client and server code should be in separate projects. You are expected to use TypeScript for both front end and back end.
Scenario

One of Panteon’s idle/clicker mobile games has grown faster than expected. The game has over 10 million registered players and sees around 2 million active players every day. Players earn in-game currency as they play, and each week starts fresh — whoever earns the most that week climbs to the top of the leaderboard.

The original leaderboard was built quickly and has been running since launch. It works — but barely. The backend team gets weekly complaints from players:
“The leaderboard takes forever to load.”
“I can see the top players fine, but I can’t find my own rank.”
“My friend is in the top 50 but the page just freezes when I scroll down.”

The product team’s ask is simple: “Make the leaderboard instant. Players should see their own rank and the players around them. Rewards should go out automatically at the end of the week.”

You are expected to design and build this system from scratch.
Requirements
System Requirements

    Architecture of the system should be stateless
    Your application will be tested on both PC and mobile
    Client and server code should be in separate projects

Requirement from the Designer

The weekly leaderboard system is built around automatically collecting 2% of the total money players earn during the week into a prize pool. At the end of the week, this pool is distributed to the top 100 players according to ranking: 1st place gets 20%, 2nd gets 15%, 3rd gets 10%; the remaining 55% is distributed among players ranked 4th through 100th, based on their rank. Once prize distribution is complete, both the pool and the leaderboard reset to start the new week.

On the leaderboard screen, players should always see the ranking of the top 100. If a player is not in the top 100, they should still be able to see their own position so they don’t lose track — in that case, along with their own rank, the 3 players above and the 2 players below them should also appear in the list.
The Interface

We want you to design a leaderboard screen for competitive players. The moment a player opens it, they should clearly see their own ranking, easily compare themselves with others, and have a smooth experience. We expect you to think about how you’ll handle the interactions that make the list easier to explore, the opportunities for global comparison, and the weekly reward/status communication. Don’t forget to include sample data so we can test it — any creative touches beyond that are yours to make.
Criterias
Technical:

    Suitability with the scenario and requirements
    Preferred technologies and their appropriate use
    Scalability
    Performance
    Code quality
    Cloud usage
    Reusable React components


A working production build should be deployed on an accessible domain
