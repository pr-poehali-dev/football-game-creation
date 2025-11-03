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
type Difficulty = 'хуйня' | 'бля ну будет трудно' | 'пиздец сложный';

interface Player {
  id: string;
  name: string;
  team: TeamName;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isUser: boolean;
  role: 'defender' | 'midfielder' | 'attacker';
  targetX?: number;
  targetY?: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const difficultySettings = {
  'хуйня': { speed: 1.2, reaction: 0.3, teamwork: 0.2 },
  'бля ну будет трудно': { speed: 2.0, reaction: 0.6, teamwork: 0.5 },
  'пиздец сложный': { speed: 3.5, reaction: 0.9, teamwork: 0.8 }
};

const Index = () => {
  const [gameState, setGameState] = useState<'team-select' | 'player-select' | 'difficulty-select' | 'playing'>('team-select');
  const [selectedTeam, setSelectedTeam] = useState<TeamName | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('хуйня');
  const [score, setScore] = useState({ 'ГЕНГ БЕНГ': 0, 'Преподаватели': 0 });
  const [players, setPlayers] = useState<Player[]>([]);
  const [ball, setBall] = useState<Ball>({ x: 400, y: 250, vx: 0, vy: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  const assignRoles = (teamPlayers: string[]): ('defender' | 'midfielder' | 'attacker')[] => {
    const roles: ('defender' | 'midfielder' | 'attacker')[] = [];
    teamPlayers.forEach((_, idx) => {
      if (idx < 2) roles.push('defender');
      else if (idx < 5) roles.push('midfielder');
      else roles.push('attacker');
    });
    return roles;
  };

  const initGame = (team: TeamName, playerName: string) => {
    const allPlayers: Player[] = [];
    const gbRoles = assignRoles(teams['ГЕНГ БЕНГ']);
    const prepRoles = assignRoles(teams['Преподаватели']);
    
    teams['ГЕНГ БЕНГ'].forEach((name, idx) => {
      const role = gbRoles[idx];
      let baseX = 100;
      if (role === 'midfielder') baseX = 250;
      if (role === 'attacker') baseX = 350;
      
      allPlayers.push({
        id: `gb-${idx}`,
        name,
        team: 'ГЕНГ БЕНГ',
        x: baseX + (Math.random() - 0.5) * 60,
        y: 80 + (idx % 3) * 140 + Math.random() * 40,
        vx: 0,
        vy: 0,
        isUser: team === 'ГЕНГ БЕНГ' && name === playerName,
        role
      });
    });

    teams['Преподаватели'].forEach((name, idx) => {
      const role = prepRoles[idx];
      let baseX = 700;
      if (role === 'midfielder') baseX = 550;
      if (role === 'attacker') baseX = 450;
      
      allPlayers.push({
        id: `prep-${idx}`,
        name,
        team: 'Преподаватели',
        x: baseX + (Math.random() - 0.5) * 60,
        y: 80 + (idx % 3) * 140 + Math.random() * 40,
        vx: 0,
        vy: 0,
        isUser: team === 'Преподаватели' && name === playerName,
        role
      });
    });

    setPlayers(allPlayers);
    setBall({ x: 400, y: 250, vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1 });
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

    const settings = difficultySettings[difficulty];

    const gameLoop = setInterval(() => {
      setPlayers(prev => prev.map(player => {
        if (player.isUser) {
          let newVx = 0;
          let newVy = 0;
          
          if (keysPressed.current.has('w') || keysPressed.current.has('ц')) newVy = -4;
          if (keysPressed.current.has('s') || keysPressed.current.has('ы')) newVy = 4;
          if (keysPressed.current.has('a') || keysPressed.current.has('ф')) newVx = -4;
          if (keysPressed.current.has('d') || keysPressed.current.has('в')) newVx = 4;

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
          const distToBall = Math.sqrt(toBallX * toBallX + toBallY * toBallY);

          const oppTeam = player.team === 'ГЕНГ БЕНГ' ? 'Преподаватели' : 'ГЕНГ БЕНГ';
          const oppGoalX = player.team === 'ГЕНГ БЕНГ' ? 780 : 20;
          const ownGoalX = player.team === 'ГЕНГ БЕНГ' ? 20 : 780;

          let targetX = player.x;
          let targetY = player.y;

          if (distToBall < 150 * settings.reaction) {
            targetX = ball.x;
            targetY = ball.y;
          } else {
            if (player.role === 'defender') {
              targetX = ownGoalX + (player.team === 'ГЕНГ БЕНГ' ? 150 : -150);
              targetY = 250 + (ball.y - 250) * 0.5;
            } else if (player.role === 'midfielder') {
              targetX = 400 + (ball.x - 400) * 0.6;
              targetY = ball.y;
            } else {
              if (distToBall < 100) {
                targetX = ball.x;
                targetY = ball.y;
              } else {
                targetX = oppGoalX + (player.team === 'ГЕНГ БЕНГ' ? -100 : 100);
                targetY = 250 + Math.sin(Date.now() / 1000 + player.id.charCodeAt(0)) * 80;
              }
            }
          }

          const dx = targetX - player.x;
          const dy = targetY - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 10) {
            const speed = settings.speed;
            const moveX = (dx / dist) * speed;
            const moveY = (dy / dist) * speed;

            return {
              ...player,
              x: Math.max(20, Math.min(780, player.x + moveX)),
              y: Math.max(20, Math.min(480, player.y + moveY)),
              vx: moveX,
              vy: moveY,
              targetX,
              targetY
            };
          }

          return player;
        }
      }));

      setBall(prev => {
        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVx = prev.vx * 0.99;
        let newVy = prev.vy * 0.99;

        if (newY <= 20 || newY >= 480) {
          newVy = -newVy * 0.8;
          newY = Math.max(20, Math.min(480, newY));
        }

        if (newX <= 20) {
          if (newY > 200 && newY < 300) {
            setScore(s => ({ ...s, 'Преподаватели': s['Преподаватели'] + 1 }));
            setTimeout(() => {
              setBall({ x: 400, y: 250, vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1 });
            }, 100);
            return { x: 400, y: 250, vx: 0, vy: 0 };
          } else {
            newVx = -newVx * 0.8;
            newX = 20;
          }
        }

        if (newX >= 780) {
          if (newY > 200 && newY < 300) {
            setScore(s => ({ ...s, 'ГЕНГ БЕНГ': s['ГЕНГ БЕНГ'] + 1 }));
            setTimeout(() => {
              setBall({ x: 400, y: 250, vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1 });
            }, 100);
            return { x: 400, y: 250, vx: 0, vy: 0 };
          } else {
            newVx = -newVx * 0.8;
            newX = 780;
          }
        }

        players.forEach(player => {
          const dx = newX - player.x;
          const dy = newY - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 25) {
            const angle = Math.atan2(dy, dx);
            const kickPower = player.isUser ? 6 : (4 + settings.speed * 0.5);
            
            const oppGoalX = player.team === 'ГЕНГ БЕНГ' ? 780 : 20;
            const oppGoalY = 250;
            const toGoalAngle = Math.atan2(oppGoalY - player.y, oppGoalX - player.x);
            
            const finalAngle = player.isUser ? angle : (angle * 0.3 + toGoalAngle * 0.7 * settings.teamwork);
            
            newVx = Math.cos(finalAngle) * kickPower + player.vx * 0.3;
            newVy = Math.sin(finalAngle) * kickPower + player.vy * 0.3;
          }
        });

        return { x: newX, y: newY, vx: newVx, vy: newVy };
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState, players, ball, difficulty]);

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

      ctx.font = '10px Roboto';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      const nameParts = player.name.split(' ');
      const displayName = nameParts.length > 1 
        ? `${nameParts[0][0]}. ${nameParts[1]}` 
        : player.name;
      ctx.strokeText(displayName, player.x, player.y + 22);
      ctx.fillText(displayName, player.x, player.y + 22);
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
    setGameState('difficulty-select');
  };

  const handleDifficultySelect = (diff: Difficulty) => {
    setDifficulty(diff);
    if (selectedTeam && selectedPlayer) {
      initGame(selectedTeam, selectedPlayer);
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

  if (gameState === 'difficulty-select') {
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
          <h1 className="text-5xl font-bold mt-4 mb-2">Уровень сложности</h1>
          <p className="text-muted-foreground">Выберите уровень</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
            <Card
              className="bg-card border-2 border-green-500/30 hover:border-green-500 transition-all duration-300 cursor-pointer p-8 hover:scale-105"
              onClick={() => handleDifficultySelect('хуйня')}
            >
              <div className="text-center">
                <Icon name="Smile" className="mx-auto mb-4 text-green-500" size={48} />
                <h3 className="text-2xl font-bold mb-3">хуйня</h3>
                <p className="text-sm text-muted-foreground mb-4">Медленные соперники, слабая командная игра</p>
                <Button className="w-full bg-green-600 hover:bg-green-700">Выбрать</Button>
              </div>
            </Card>

            <Card
              className="bg-card border-2 border-yellow-500/30 hover:border-yellow-500 transition-all duration-300 cursor-pointer p-8 hover:scale-105"
              onClick={() => handleDifficultySelect('бля ну будет трудно')}
            >
              <div className="text-center">
                <Icon name="Meh" className="mx-auto mb-4 text-yellow-500" size={48} />
                <h3 className="text-2xl font-bold mb-3">бля ну будет трудно</h3>
                <p className="text-sm text-muted-foreground mb-4">Быстрые соперники, средняя тактика</p>
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700">Выбрать</Button>
              </div>
            </Card>

            <Card
              className="bg-card border-2 border-red-500/30 hover:border-red-500 transition-all duration-300 cursor-pointer p-8 hover:scale-105"
              onClick={() => handleDifficultySelect('пиздец сложный')}
            >
              <div className="text-center">
                <Icon name="Skull" className="mx-auto mb-4 text-red-500" size={48} />
                <h3 className="text-2xl font-bold mb-3">пиздец сложный</h3>
                <p className="text-sm text-muted-foreground mb-4">Профессионалы, идеальная командная игра</p>
                <Button className="w-full bg-red-600 hover:bg-red-700">Выбрать</Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="text-center pb-8">
          <Button variant="outline" onClick={() => setGameState('player-select')}>
            <Icon name="ArrowLeft" className="mr-2" size={16} />
            Назад к выбору игрока
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
        <div className="text-sm text-muted-foreground mt-1">Сложность: {difficulty}</div>
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