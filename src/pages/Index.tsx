import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const teams = {
  'ГЕНГ БЕНГ': [
    'Шитенков Никита',
    'Скворцов Иван',
    'Новиков Даня',
    'Лобанов Максим',
    'Никуленков Данила',
    'Морозов Ярослав',
    'Стрелков Миша'
  ],
  'Преподаватели': [
    'Беляева Диана',
    'Бестужева Светлана',
    'Горбунова Татьяна',
    'Коломенская Любовь',
    'Николенко Евгений',
    'Базанова Елена'
  ]
};

type TeamName = keyof typeof teams;

interface Player {
  id: string;
  name: string;
  team: TeamName;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isUser: boolean;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const Index = () => {
  const [gameState, setGameState] = useState<'team-select' | 'player-select' | 'playing'>('team-select');
  const [selectedTeam, setSelectedTeam] = useState<TeamName | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [score, setScore] = useState({ 'ГЕНГ БЕНГ': 0, 'Преподаватели': 0 });
  const [players, setPlayers] = useState<Player[]>([]);
  const [ball, setBall] = useState<Ball>({ x: 400, y: 250, vx: 0, vy: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  const initGame = (team: TeamName, playerName: string) => {
    const allPlayers: Player[] = [];
    
    teams['ГЕНГ БЕНГ'].forEach((name, idx) => {
      allPlayers.push({
        id: `gb-${idx}`,
        name,
        team: 'ГЕНГ БЕНГ',
        x: 100 + (idx % 4) * 80,
        y: 100 + Math.floor(idx / 4) * 120,
        vx: 0,
        vy: 0,
        isUser: team === 'ГЕНГ БЕНГ' && name === playerName
      });
    });

    teams['Преподаватели'].forEach((name, idx) => {
      allPlayers.push({
        id: `prep-${idx}`,
        name,
        team: 'Преподаватели',
        x: 600 + (idx % 4) * 80,
        y: 100 + Math.floor(idx / 4) * 120,
        vx: 0,
        vy: 0,
        isUser: team === 'Преподаватели' && name === playerName
      });
    });

    setPlayers(allPlayers);
    setBall({ x: 400, y: 250, vx: 0, vy: 0 });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setPlayers(prev => prev.map(player => {
        if (player.isUser) {
          let newVx = 0;
          let newVy = 0;
          
          if (keysPressed.current.has('w') || keysPressed.current.has('ц')) newVy = -3;
          if (keysPressed.current.has('s') || keysPressed.current.has('ы')) newVy = 3;
          if (keysPressed.current.has('a') || keysPressed.current.has('ф')) newVx = -3;
          if (keysPressed.current.has('d') || keysPressed.current.has('в')) newVx = 3;

          return {
            ...player,
            x: Math.max(20, Math.min(780, player.x + newVx)),
            y: Math.max(20, Math.min(480, player.y + newVy)),
            vx: newVx,
            vy: newVy
          };
        } else {
          const toBallX = ball.x - player.x;
          const toBallY = ball.y - player.y;
          const dist = Math.sqrt(toBallX * toBallX + toBallY * toBallY);
          
          if (dist > 50) {
            const speed = 1.5;
            return {
              ...player,
              x: player.x + (toBallX / dist) * speed,
              y: player.y + (toBallY / dist) * speed,
              vx: (toBallX / dist) * speed,
              vy: (toBallY / dist) * speed
            };
          }
          
          return player;
        }
      }));

      setBall(prev => {
        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVx = prev.vx * 0.98;
        let newVy = prev.vy * 0.98;

        if (newY <= 20 || newY >= 480) {
          newVy = -newVy;
          newY = Math.max(20, Math.min(480, newY));
        }

        if (newX <= 20) {
          if (newY > 200 && newY < 300) {
            setScore(s => ({ ...s, 'Преподаватели': s['Преподаватели'] + 1 }));
            return { x: 400, y: 250, vx: 0, vy: 0 };
          } else {
            newVx = -newVx;
            newX = 20;
          }
        }

        if (newX >= 780) {
          if (newY > 200 && newY < 300) {
            setScore(s => ({ ...s, 'ГЕНГ БЕНГ': s['ГЕНГ БЕНГ'] + 1 }));
            return { x: 400, y: 250, vx: 0, vy: 0 };
          } else {
            newVx = -newVx;
            newX = 780;
          }
        }

        players.forEach(player => {
          const dx = newX - player.x;
          const dy = newY - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 25) {
            const angle = Math.atan2(dy, dx);
            newVx = Math.cos(angle) * 4 + player.vx;
            newVy = Math.sin(angle) * 4 + player.vy;
          }
        });

        return { x: newX, y: newY, vx: newVx, vy: newVy };
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState, players, ball]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 800, 500);

    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 0, 800, 500);

    for (let i = 0; i < 500; i += 40) {
      ctx.fillStyle = i % 80 === 0 ? '#2d5016' : '#336b1f';
      ctx.fillRect(0, i, 800, 40);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 800, 500);
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 500);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(400, 250, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 180, 30, 140);
    ctx.fillRect(770, 180, 30, 140);

    players.forEach(player => {
      const gradient = ctx.createRadialGradient(player.x, player.y - 5, 5, player.x, player.y - 5, 20);
      if (player.team === 'ГЕНГ БЕНГ') {
        gradient.addColorStop(0, '#0EA5E9');
        gradient.addColorStop(1, '#0369a1');
      } else {
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(1, '#991b1b');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.isUser ? 18 : 15, 0, Math.PI * 2);
      ctx.fill();
      
      if (player.isUser) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    const ballGradient = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 2, ball.x, ball.y, 12);
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [players, ball, gameState]);

  const handleTeamSelect = (team: TeamName) => {
    setSelectedTeam(team);
    setGameState('player-select');
  };

  const handlePlayerSelect = (playerName: string) => {
    setSelectedPlayer(playerName);
    if (selectedTeam) {
      initGame(selectedTeam, playerName);
      setGameState('playing');
    }
  };

  if (gameState === 'team-select') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <div className="absolute top-8 left-8 text-sm tracking-wider">
          ФУТБОЛЬНАЯ КОМАНДА
        </div>
        <div className="absolute top-8 right-8 text-2xl font-bold tracking-wider">
          ГЕНГ БЕНГ
        </div>
        <div className="text-center mt-16 mb-8">
          <div className="text-lg tracking-[0.3em]">ГЕНГ БЕНГ - 27.10.2025 - 30.10.2025</div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            {(Object.keys(teams) as TeamName[]).map((team) => (
              <Card
                key={team}
                className="bg-card border-2 border-primary/30 hover:border-primary transition-all duration-300 cursor-pointer p-8 hover:scale-105"
                onClick={() => handleTeamSelect(team)}
              >
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-6 tracking-wide">{team}</h2>
                  <div className="space-y-2 text-sm">
                    {teams[team].map((player, idx) => (
                      <div key={idx} className="text-muted-foreground">
                        {player}
                      </div>
                    ))}
                  </div>
                  <Button className="mt-6 w-full" variant="default">
                    <Icon name="Users" className="mr-2" size={20} />
                    Выбрать команду
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'player-select' && selectedTeam) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <div className="absolute top-8 left-8 text-sm tracking-wider">
          ФУТБОЛЬНАЯ КОМАНДА
        </div>
        <div className="absolute top-8 right-8 text-2xl font-bold tracking-wider">
          ГЕНГ БЕНГ
        </div>
        <div className="text-center mt-16 mb-8">
          <div className="text-lg tracking-[0.3em]">ГЕНГ БЕНГ - 27.10.2025 - 30.10.2025</div>
          <h1 className="text-5xl font-bold mt-4 mb-2">{selectedTeam}</h1>
          <p className="text-muted-foreground">Выберите игрока</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl w-full">
            {teams[selectedTeam].map((player) => (
              <Card
                key={player}
                className="bg-card border-2 border-primary/30 hover:border-primary transition-all duration-300 cursor-pointer p-6 hover:scale-105"
                onClick={() => handlePlayerSelect(player)}
              >
                <div className="text-center">
                  <Icon name="User" className="mx-auto mb-3 text-primary" size={32} />
                  <div className="font-semibold">{player}</div>
                  <Button className="mt-4 w-full" size="sm">
                    Играть
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center pb-8">
          <Button variant="outline" onClick={() => setGameState('team-select')}>
            <Icon name="ArrowLeft" className="mr-2" size={16} />
            Назад к выбору команды
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="absolute top-8 left-8 text-sm tracking-wider z-10">
        ФУТБОЛЬНАЯ КОМАНДА
      </div>
      <div className="absolute top-8 right-8 text-2xl font-bold tracking-wider z-10">
        ГЕНГ БЕНГ
      </div>

      <div className="text-center mt-16 mb-4">
        <div className="text-lg tracking-[0.3em]">ГЕНГ БЕНГ - 27.10.2025 - 30.10.2025</div>
      </div>

      <div className="flex items-center justify-center gap-12 mb-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">ГЕНГ БЕНГ</div>
          <div className="text-5xl font-bold text-primary">{score['ГЕНГ БЕНГ']}</div>
        </div>
        <div className="text-3xl text-muted-foreground">:</div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Преподаватели</div>
          <div className="text-5xl font-bold text-destructive">{score['Преподаватели']}</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 pb-8">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="border-4 border-primary/30 rounded-lg shadow-2xl"
          />
          <div className="absolute -bottom-12 left-0 right-0 text-center text-sm text-muted-foreground">
            Управление: W/A/S/D или Ц/Ф/Ы/В
          </div>
        </div>
      </div>

      <div className="text-center pb-8">
        <Button
          variant="outline"
          onClick={() => {
            setGameState('team-select');
            setScore({ 'ГЕНГ БЕНГ': 0, 'Преподаватели': 0 });
          }}
        >
          <Icon name="RotateCcw" className="mr-2" size={16} />
          Новая игра
        </Button>
      </div>
    </div>
  );
};

export default Index;
