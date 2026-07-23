export type ThemeId =
  | "famosos"
  | "desenhos"
  | "filmes"
  | "series"
  | "games"
  | "esportistas"
  | "aleatorio";

export const THEMES: { id: ThemeId; label: string; emoji: string; hint: string }[] = [
  { id: "famosos", label: "Famosos", emoji: "🌟", hint: "Artistas, cantores, criadores" },
  { id: "desenhos", label: "Desenhos e anime", emoji: "🎨", hint: "Do Mickey ao Goku" },
  { id: "filmes", label: "Filmes", emoji: "🎬", hint: "Heróis, vilões e clássicos" },
  { id: "series", label: "Séries", emoji: "📺", hint: "Streaming e TV" },
  { id: "games", label: "Games", emoji: "🎮", hint: "Personagens de videogame" },
  { id: "esportistas", label: "Esportistas", emoji: "⚽", hint: "Lendas de qualquer quadra" },
  { id: "aleatorio", label: "Aleatório", emoji: "🎲", hint: "Mistura todos os temas" },
];

export const WORD_BANK: Record<Exclude<ThemeId, "aleatorio">, string[]> = {
  famosos: [
    "Anitta", "Ivete Sangalo", "Xuxa", "Silvio Santos", "Faustão", "Ana Maria Braga",
    "Luciano Huck", "Wesley Safadão", "Gusttavo Lima", "Pabllo Vittar", "Ludmilla",
    "Whindersson Nunes", "Felipe Neto", "Casimiro", "Gaules", "Virgínia Fonseca",
    "Bruna Marquezine", "Wagner Moura", "Fernanda Montenegro", "Selton Mello",
    "Taylor Swift", "Beyoncé", "Rihanna", "Michael Jackson", "Freddie Mercury",
    "Madonna", "Lady Gaga", "Bad Bunny", "Shakira", "Elon Musk", "MrBeast",
    "Keanu Reeves", "Leonardo DiCaprio", "Angelina Jolie", "Will Smith",
    "Scarlett Johansson", "Denzel Washington", "Meryl Streep", "Jim Carrey", "Adele",
  ],
  desenhos: [
    "Goku", "Vegeta", "Naruto", "Sasuke", "Luffy", "Zoro", "Eren Jaeger", "Levi",
    "Pikachu", "Ash Ketchum", "Sailor Moon", "Cavaleiros do Zodíaco Seiya", "Bob Esponja",
    "Patrick Estrela", "Lula Molusco", "Tom", "Jerry", "Pernalonga", "Pica-Pau",
    "Mickey Mouse", "Pato Donald", "Pluto", "Simba", "Mufasa", "Nemo", "Dory",
    "Woody", "Buzz Lightyear", "Shrek", "Burro do Shrek", "Elsa", "Moana",
    "Homer Simpson", "Bart Simpson", "Rick Sanchez", "Morty", "Mônica", "Cebolinha",
    "Cascão", "Magali", "Chaves", "Kiko", "Scooby-Doo", "Salsicha",
  ],
  filmes: [
    "Homem-Aranha", "Homem de Ferro", "Capitão América", "Thor", "Hulk", "Viúva Negra",
    "Thanos", "Loki", "Batman", "Coringa", "Superman", "Mulher-Maravilha", "Flash",
    "Darth Vader", "Luke Skywalker", "Yoda", "Han Solo", "Neo", "Morpheus",
    "Indiana Jones", "Marty McFly", "Doutor Emmett Brown", "Forrest Gump",
    "Jack Sparrow", "Frodo", "Gandalf", "Gollum", "Aragorn", "Harry Potter",
    "Hermione Granger", "Voldemort", "Hagrid", "Rocky Balboa", "John Wick",
    "James Bond", "Hannibal Lecter", "Vito Corleone", "Jack Dawson", "Rose DeWitt",
    "Freddy Krueger", "Chucky", "E.T.", "King Kong", "Godzilla",
  ],
  series: [
    "Michael Scott", "Dwight Schrute", "Jim Halpert", "Pam Beesly", "Ross Geller",
    "Rachel Green", "Joey Tribbiani", "Chandler Bing", "Monica Geller", "Phoebe Buffay",
    "Walter White", "Jesse Pinkman", "Saul Goodman", "Gus Fring", "Eleven",
    "Dustin Henderson", "Demogorgon", "Jon Snow", "Daenerys Targaryen", "Tyrion Lannister",
    "Arya Stark", "Cersei Lannister", "Sheldon Cooper", "Dexter Morgan", "Tony Soprano",
    "Don Draper", "Rick Grimes", "Negan", "Joel Miller", "Ellie", "Seong Gi-hun",
    "Doutor House", "Barney Stinson", "Ted Mosby", "Homelander", "Billy Butcher",
    "Geralt de Rívia", "Vecna", "Wandinha Addams", "Mandaloriano",
  ],
  games: [
    "Mario", "Luigi", "Princesa Peach", "Bowser", "Yoshi", "Donkey Kong", "Link",
    "Zelda", "Ganondorf", "Samus Aran", "Kirby", "Sonic", "Tails", "Knuckles",
    "Doutor Robotnik", "Kratos", "Lara Croft", "Master Chief", "Solid Snake",
    "Cloud Strife", "Sephiroth", "Ryu", "Chun-Li", "Scorpion", "Sub-Zero", "Pac-Man",
    "Steve do Minecraft", "Creeper", "Herobrine", "Ezio Auditore", "Geralt",
    "Arthur Morgan", "Trevor Philips", "CJ do San Andreas", "Crash Bandicoot",
    "Spyro", "Rayman", "Pikachu", "Charizard", "Agente 47", "Big Boss", "Nathan Drake",
  ],
  esportistas: [
    "Pelé", "Garrincha", "Zico", "Romário", "Ronaldo Fenômeno", "Ronaldinho Gaúcho",
    "Rivaldo", "Kaká", "Neymar", "Vinícius Júnior", "Marta", "Formiga", "Cafu",
    "Roberto Carlos", "Taffarel", "Diego Maradona", "Lionel Messi", "Cristiano Ronaldo",
    "Zinedine Zidane", "Ronaldinho", "Mbappé", "Haaland", "Michael Jordan", "Kobe Bryant",
    "LeBron James", "Shaquille O'Neal", "Stephen Curry", "Oscar Schmidt", "Ayrton Senna",
    "Rubens Barrichello", "Felipe Massa", "Lewis Hamilton", "Michael Schumacher",
    "Usain Bolt", "Muhammad Ali", "Mike Tyson", "Anderson Silva", "José Aldo",
    "Serena Williams", "Guga Kuerten", "Rafael Nadal", "Roger Federer", "Simone Biles",
    "Michael Phelps", "Neymar Jr", "Hortência", "Bernardinho", "Giba",
  ],
};

export function poolFor(theme: ThemeId): string[] {
  if (theme === "aleatorio") return Object.values(WORD_BANK).flat();
  return WORD_BANK[theme];
}
