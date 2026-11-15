export interface MarsFact {
  id: string;
  title: string;
  text: string;
  source: string;
}

export const MARS_FACTS: MarsFact[] = [
  {
    id: 'gravity',
    title: 'Gravity',
    text: 'The Martian surface gravity is about 38% of Earth’s (3.71 m/s²). Astronauts will need to adapt to lighter locomotion, but muscle and bone concerns remain for long stays.',
    source: 'NASA Mars Fact Sheet',
  },
  {
    id: 'atmosphere',
    title: 'Atmosphere',
    text: 'Mars has a thin atmosphere about 95% carbon dioxide with a surface pressure near 6 mbar — far too thin for liquid water to persist on the surface today.',
    source: 'NASA Mars Fact Sheet',
  },
  {
    id: 'temperature',
    title: 'Temperature',
    text: 'Average surface temperature is about −63 °C, with seasonal and polar swings that can range from about −140 °C to +20 °C.',
    source: 'NASA Mars Fact Sheet',
  },
  {
    id: 'olympus',
    title: 'Olympus Mons',
    text: 'Olympus Mons is roughly 21.9 km high — about three times the height of Mount Everest — with a very gentle slope that would allow very long traversable routes.',
    source: 'NASA Mars Fact Sheet / USGS Astrogeology',
  },
  {
    id: 'valles',
    title: 'Valles Marineris',
    text: 'Valles Marineris is a canyon system that may preserve ancient water-related geology, making it a key region for the search for past habitability.',
    source: 'NASA Mars Fact Sheet / USGS Astrogeology',
  },
  {
    id: 'missions',
    title: 'Past and present exploration',
    text: 'Surface exploration includes Viking landers, Pathfinder/Sojourner, Spirit and Opportunity, Phoenix, Curiosity, InSight, Perseverance and the Ingenuity helicopter.',
    source: 'NASA Mars Exploration Program',
  },
  {
    id: 'isro-mom',
    title: 'ISRO Mars Orbiter Mission',
    text: 'India\u2019s Mars Orbiter Mission (Mangalyaan), launched by ISRO in 2013, made India the first Asian nation to reach Mars orbit and the first country to do so on its first attempt. The spacecraft carried the Mars Colour Camera (MCC), which returned global and regional colour images of the Martian surface during its 2014\u20132022 mission lifetime.',
    source: 'ISRO · Mars Orbiter Mission',
  },
];
