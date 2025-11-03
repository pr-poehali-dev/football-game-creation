import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/components/ui/use-toast';

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
  role: 'goalkeeper' | 'defender' | 'midfielder' | 'attacker';
  targetX?: number;
  targetY?: number;
  hasBall: boolean;
  stamina: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: string | null;
}

const difficultySettings = {
  'хуйня': { speed: 1.8, reaction: 0.4, teamwork: 0.3, accuracy: 0.3 },
  'бля ну будет трудно': { speed: 2.5, reaction: 0.7, teamwork: 0.6, accuracy: 0.6 },
  'пиздец сложный': { speed: 3.5, reaction: 0.95, teamwork: 0.9, accuracy: 0.85 }
};

const Index = () => {
  const [gameState, setGameState] = useState<'team-select' | 'player-select' | 'difficulty-select' | 'playing'>('team-select');
  const [selectedTeam, setSelectedTeam] = useState<TeamName | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('хуйня');
  const [score, setScore] = useState({ 'ГЕНГ БЕНГ': 0, 'Преподаватели': 0 });
  const [players, setPlayers] = useState<Player[]>([]);
  const [ball, setBall] = useState<Ball>({ x: 400, y: 250, vx: 0, vy: 0, owner: null });
  const [matchTime, setMatchTime] = useState(0);
  const [halfTime, setHalfTime] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  const assignRole = (name: string, team: TeamName): 'goalkeeper' | 'defender' | 'midfielder' | 'attacker' => {
    if (team === 'ГЕНГ БЕНГ' && name === 'Стрелков Миша') return 'goalkeeper';
    if (team === 'Преподаватели' && name === 'Николенко Евгений') return 'goalkeeper';
    
    const teamPlayers = teams[team];
    const idx = teamPlayers.indexOf(name);
    
    if (idx < 2) return 'defender';
    if (idx < 5) return 'midfielder';
    return 'attacker';
  };

  const initGame = (team: TeamName, playerName: string) => {
    const allPlayers: Player[] = [];
    
    teams['ГЕНГ БЕНГ'].forEach((name, idx) => {
      const role = assignRole(name, 'ГЕНГ БЕНГ');
      let baseX = 150;
      let baseY = 80 + (idx % 3) * 140 + Math.random() * 40;
      
      if (role === 'goalkeeper') {
        baseX = 50;
        baseY = 250;
      } else if (role === 'defender') {
        baseX = 150;
        baseY = 150 + (idx % 2) * 200;
      } else if (role === 'midfielder') {
        baseX = 280;
        baseY = 120 + (idx % 3) * 120;
      } else if (role === 'attacker') {
        baseX = 380;
        baseY = 180 + (idx % 2) * 140;
      }
      
      allPlayers.push({
        id: `gb-${idx}`,
        name,
        team: 'ГЕНГ БЕНГ',
        x: baseX + (role === 'goalkeeper' ? 0 : (Math.random() - 0.5) * 30),
        y: baseY,
        vx: 0,
        vy: 0,
        isUser: team === 'ГЕНГ БЕНГ' && name === playerName,
        role,
        hasBall: false,
        stamina: 100
      });
    });

    teams['Преподаватели'].forEach((name, idx) => {
      const role = assignRole(name, 'Преподаватели');
      let baseX = 650;
      let baseY = 80 + (idx % 3) * 140 + Math.random() * 40;
      
      if (role === 'goalkeeper') {
        baseX = 750;
        baseY = 250;
      } else if (role === 'defender') {
        baseX = 650;
        baseY = 150 + (idx % 2) * 200;
      } else if (role === 'midfielder') {
        baseX = 520;
        baseY = 120 + (idx % 3) * 120;
      } else if (role === 'attacker') {
        baseX = 420;
        baseY = 180 + (idx % 2) * 140;
      }
      
      allPlayers.push({
        id: `prep-${idx}`,
        name,
        team: 'Преподаватели',
        x: baseX + (role === 'goalkeeper' ? 0 : (Math.random() - 0.5) * 30),
        y: baseY,
        vx: 0,
        vy: 0,
        isUser: team === 'Преподаватели' && name === playerName,
        role,
        hasBall: false,
        stamina: 100
      });
    });

    setPlayers(allPlayers);
    setBall({ x: 400, y: 250, vx: 0, vy: 0, owner: null });
    setMatchTime(0);
    setHalfTime(1);
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

    const timeInterval = setInterval(() => {
      setMatchTime(prev => {
        const newTime = prev + 1;
        if (newTime === 45 && halfTime === 1) {
          toast({
            title: "Первый тайм окончен!",
            description: "Начинается второй тайм"
          });
          setHalfTime(2);
        }
        if (newTime === 90) {
          toast({
            title: "Матч окончен!",
            description: `Итоговый счёт: ${score['ГЕНГ БЕНГ']} - ${score['Преподаватели']}`
          });
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [gameState, halfTime, score]);

  useEffect(() => {
    if (gameState !== 'playing' || matchTime >= 90) return;

    const settings = difficultySettings[difficulty];

    const gameLoop = setInterval(() => {
      setPlayers(prev => prev.map(player => {
        const newStamina = Math.max(0, player.stamina - 0.01);
        
        if (player.isUser) {
          let newVx = 0;
          let newVy = 0;
          const sprintMultiplier = keysPressed.current.has('shift') ? 1.5 : 1;
          const speedFactor = (newStamina / 100) * 0.5 + 0.5;
          
          if (keysPressed.current.has('w') || keysPressed.current.has('ц')) newVy = -4 * sprintMultiplier * speedFactor;
          if (keysPressed.current.has('s') || keysPressed.current.has('ы')) newVy = 4 * sprintMultiplier * speedFactor;
          if (keysPressed.current.has('a') || keysPressed.current.has('ф')) newVx = -4 * sprintMultiplier * speedFactor;
          if (keysPressed.current.has('d') || keysPressed.current.has('в')) newVx = 4 * sprintMultiplier * speedFactor;

          if (keysPressed.current.has(' ') && player.hasBall) {
            const oppGoalX = player.team === 'ГЕНГ БЕНГ' ? 780 : 20;
            const oppGoalY = 250;
            const angle = Math.atan2(oppGoalY - player.y, oppGoalX - player.x);
            
            setBall(prev => ({
              ...prev,
              vx: Math.cos(angle) * 8,
              vy: Math.sin(angle) * 8,
              owner: null
            }));
          }

          return {
            ...player,
            x: Math.max(20, Math.min(780, player.x + newVx)),
            y: Math.max(20, Math.min(480, player.y + newVy)),
            vx: newVx,
            vy: newVy,
            stamina: sprintMultiplier > 1 ? Math.max(0, newStamina - 0.05) : Math.min(100, newStamina + 0.02)
          };
        } else {
          const toBallX = ball.x - player.x;
          const toBallY = ball.y - player.y;
          const distToBall = Math.sqrt(toBallX * toBallX + toBallY * toBallY);

          const oppGoalX = player.team === 'ГЕНГ БЕНГ' ? 780 : 20;
          const ownGoalX = player.team === 'ГЕНГ БЕНГ' ? 20 : 780;

          let targetX = player.x;
          let targetY = player.y;
          let speedMultiplier = 1;

          if (player.role === 'goalkeeper') {
            const goalX = player.team === 'ГЕНГ БЕНГ' ? 50 : 750;
            const goalTop = 180;
            const goalBottom = 320;
            
            if (distToBall < 250 && ((player.team === 'ГЕНГ БЕНГ' && ball.x < 300) || (player.team === 'Преподаватели' && ball.x > 500))) {
              targetX = Math.max(30, Math.min(770, ball.x));
              targetY = Math.max(goalTop, Math.min(goalBottom, ball.y));
              speedMultiplier = 2.5;
              
              if (distToBall < 30) {
                setBall(prev => ({
                  ...prev,
                  vx: prev.vx * -0.5,
                  vy: (Math.random() - 0.5) * 6,
                  owner: null
                }));
              }
            } else {
              targetX = goalX;
              targetY = 250;
            }
          } else if (ball.owner === player.id) {
            const teammatesInFront = prev.filter(p => 
              p.team === player.team && 
              p.id !== player.id &&
              (player.team === 'ГЕНГ БЕНГ' ? p.x > player.x : p.x < player.x)
            );

            if (teammatesInFront.length > 0 && Math.random() < settings.teamwork) {
              const target = teammatesInFront[Math.floor(Math.random() * teammatesInFront.length)];
              const passAngle = Math.atan2(target.y - player.y, target.x - player.x);
              setBall(prev => ({
                ...prev,
                vx: Math.cos(passAngle) * 6,
                vy: Math.sin(passAngle) * 6,
                owner: null
              }));
            } else {
              targetX = oppGoalX + (player.team === 'ГЕНГ БЕНГ' ? -50 : 50);
              targetY = 250;
              
              const distToGoal = Math.sqrt((oppGoalX - player.x) ** 2 + (250 - player.y) ** 2);
              if (distToGoal < 200 && Math.random() < settings.accuracy) {
                const shootAngle = Math.atan2(250 - player.y, oppGoalX - player.x);
                setBall(prev => ({
                  ...prev,
                  vx: Math.cos(shootAngle) * 9,
                  vy: Math.sin(shootAngle) * 9,
                  owner: null
                }));
              }
            }
          } else if (distToBall < 150 * settings.reaction) {
            targetX = ball.x;
            targetY = ball.y;
            speedMultiplier = 1.5;
          } else {
            if (player.role === 'defender') {
              targetX = ownGoalX + (player.team === 'ГЕНГ БЕНГ' ? 180 : -180);
              targetY = 250 + (ball.y - 250) * 0.6;
            } else if (player.role === 'midfielder') {
              targetX = 400 + (ball.x - 400) * 0.7;
              targetY = ball.y;
            } else {
              targetX = oppGoalX + (player.team === 'ГЕНГ БЕНГ' ? -120 : 120);
              targetY = 250 + Math.sin(Date.now() / 1000 + player.id.charCodeAt(0)) * 100;
            }
          }

          const dx = targetX - player.x;
          const dy = targetY - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 5) {
            const speedFactor = (newStamina / 100) * 0.5 + 0.5;
            const speed = settings.speed * speedMultiplier * speedFactor;
            const moveX = (dx / dist) * speed;
            const moveY = (dy / dist) * speed;

            return {
              ...player,
              x: Math.max(20, Math.min(780, player.x + moveX)),
              y: Math.max(20, Math.min(480, player.y + moveY)),
              vx: moveX,
              vy: moveY,
              stamina: speedMultiplier > 1 ? Math.max(0, newStamina - 0.03) : Math.min(100, newStamina + 0.01)
            };
          }

          return { ...player, stamina: Math.min(100, newStamina + 0.02) };
        }
      }));

      setBall(prev => {
        if (prev.owner) {
          const owner = players.find(p => p.id === prev.owner);
          if (owner) {
            return {
              ...prev,
              x: owner.x,
              y: owner.y,
              vx: 0,
              vy: 0
            };
          }
        }

        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVx = prev.vx * 0.97;
        let newVy = prev.vy * 0.97;

        if (Math.abs(newVx) < 0.1 && Math.abs(newVy) < 0.1) {
          newVx = 0;
          newVy = 0;
        }

        if (newY <= 20 || newY >= 480) {
          newVy = -newVy * 0.7;
          newY = Math.max(20, Math.min(480, newY));
        }

        if (newX <= 20) {
          if (newY > 180 && newY < 320) {
            setScore(s => ({ ...s, 'Преподаватели': s['Преподаватели'] + 1 }));
            toast({
              title: "ГОЛ! 🎉",
              description: "Команда Преподаватели забила!"
            });
            setTimeout(() => {
              setBall({ x: 400, y: 250, vx: 0, vy: 0, owner: null });
            }, 100);
            return { x: 400, y: 250, vx: 0, vy: 0, owner: null };
          } else {
            newVx = -newVx * 0.7;
            newX = 20;
          }
        }

        if (newX >= 780) {
          if (newY > 180 && newY < 320) {
            setScore(s => ({ ...s, 'ГЕНГ БЕНГ': s['ГЕНГ БЕНГ'] + 1 }));
            toast({
              title: "ГОЛ! 🎉",
              description: "Команда ГЕНГ БЕНГ забила!"
            });
            setTimeout(() => {
              setBall({ x: 400, y: 250, vx: 0, vy: 0, owner: null });
            }, 100);
            return { x: 400, y: 250, vx: 0, vy: 0, owner: null };
          } else {
            newVx = -newVx * 0.7;
            newX = 780;
          }
        }

        let newOwner = prev.owner;
        players.forEach(player => {
          const dx = newX - player.x;
          const dy = newY - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 20 && !prev.owner) {
            newOwner = player.id;
            setPlayers(prevPlayers => prevPlayers.map(p => ({
              ...p,
              hasBall: p.id === player.id
            })));
          }
        });

        return { x: newX, y: newY, vx: newVx, vy: newVy, owner: newOwner };
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState, players, ball, difficulty, matchTime]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 800, 500);

    const fieldGradient = ctx.createLinearGradient(0, 0, 0, 500);
    fieldGradient.addColorStop(0, '#2d5016');
    fieldGradient.addColorStop(0.5, '#336b1f');
    fieldGradient.addColorStop(1, '#2d5016');
    ctx.fillStyle = fieldGradient;
    ctx.fillRect(0, 0, 800, 500);

    for (let i = 0; i < 500; i += 40) {
      ctx.fillStyle = i % 80 === 0 ? 'rgba(45, 80, 22, 0.3)' : 'rgba(51, 107, 31, 0.3)';
      ctx.fillRect(0, i, 800, 40);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 800, 500);
    
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 500);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(400, 250, 70, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(400, 250, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 180, 60, 140);
    ctx.strokeRect(740, 180, 60, 140);
    
    ctx.strokeRect(0, 210, 25, 80);
    ctx.strokeRect(775, 210, 25, 80);

    ctx.fillStyle = 'rgba(26, 26, 26, 0.8)';
    ctx.fillRect(0, 180, 3, 140);
    ctx.fillRect(797, 180, 3, 140);

    players.forEach(player => {
      const gradient = ctx.createRadialGradient(player.x, player.y - 5, 5, player.x, player.y - 5, 20);
      if (player.role === 'goalkeeper') {
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(1, '#f59e0b');
      } else if (player.team === 'ГЕНГ БЕНГ') {
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
        ctx.arc(player.x, player.y, 21, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (player.hasBall) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
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
      ctx.strokeText(displayName, player.x, player.y + 24);
      ctx.fillText(displayName, player.x, player.y + 24);

      const staminaWidth = 30;
      const staminaHeight = 4;
      const staminaX = player.x - staminaWidth / 2;
      const staminaY = player.y - 28;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(staminaX, staminaY, staminaWidth, staminaHeight);
      
      const staminaColor = player.stamina > 60 ? '#22c55e' : player.stamina > 30 ? '#f59e0b' : '#ef4444';
      ctx.fillStyle = staminaColor;
      ctx.fillRect(staminaX, staminaY, staminaWidth * (player.stamina / 100), staminaHeight);
    });

    if (!ball.owner) {
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
      
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ball.x - 7, ball.y - 7);
      ctx.lineTo(ball.x + 7, ball.y + 7);
      ctx.moveTo(ball.x - 7, ball.y + 7);
      ctx.lineTo(ball.x + 7, ball.y - 7);
      ctx.stroke();
    }
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        <div className="text-sm text-muted-foreground mt-1">
          {halfTime === 1 ? 'Первый тайм' : 'Второй тайм'} | {formatTime(matchTime)} | Сложность: {difficulty}
        </div>
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
            Управление: W/A/S/D (Shift - спринт, Пробел - удар)
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
