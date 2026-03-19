// The 72 Spirits of the Ars Goetia — Lesser Key of Solomon
// Domains, barbarous words of invocation, and dream resonances for each spirit.
// Barbarous words drawn from variant name-forms across grimoire traditions (Lemegeton,
// Pseudomonarchia Daemonum, Book of Abramelin, Johann Weyer) and PGM voces magicae.

export type Rank = 'King' | 'Duke' | 'Prince' | 'Marquis' | 'President' | 'Earl' | 'Knight' | 'Count'

export interface GoetiaSpirit {
  number: number
  name: string
  rank: Rank
  domains: string[]
  barbarous: string         // invocation barbarous word / name variants
  seal: string              // sigil description
  dream_resonance: string[] // dream symbols/themes that suggest this spirit's presence
  appearance: string        // traditional appearance in visions/dreams
}

export const SPIRITS: GoetiaSpirit[] = [
  {
    number: 1, name: 'Bael', rank: 'King',
    domains: ['invisibility', 'cunning', 'leadership', 'multiplicity'],
    barbarous: 'BAEL · BAAL · BA-EL · BAELL',
    seal: 'A triangle containing a horizontal line and a cross; crown above',
    dream_resonance: ['three-headed figures', 'cats', 'toads', 'men in mist', 'invisibility', 'silence'],
    appearance: 'Three heads: a toad, a man, a cat; spider body; hoarse voice',
  },
  {
    number: 2, name: 'Agares', rank: 'Duke',
    domains: ['language', 'earthquakes', 'power over runaways', 'teaching'],
    barbarous: 'AGARES · AGARAT · AGARAT IAO',
    seal: 'A cross with serpentine lines; hawk above',
    dream_resonance: ['earthquakes', 'running away', 'foreign places', 'learning', 'old men', 'crocodiles'],
    appearance: 'An old man riding a crocodile, carrying a goshawk',
  },
  {
    number: 3, name: 'Vassago', rank: 'Prince',
    domains: ['finding lost things', 'prophecy', 'past and future', 'nature'],
    barbarous: 'VASSAGO · USAGOO · VASSAGOO',
    seal: 'A circle with internal angular symbols',
    dream_resonance: ['searching', 'lost objects', 'prophetic visions', 'gentle guides', 'revelation'],
    appearance: 'Same as Agares, benevolent nature',
  },
  {
    number: 4, name: 'Samigina', rank: 'Marquis',
    domains: ['liberal arts', 'souls of the drowned', 'knowledge of the dead'],
    barbarous: 'SAMIGINA · GAMIGIN · GAMIGON',
    seal: 'A horse head with angular lines beneath',
    dream_resonance: ['horses', 'drowning', 'water', 'libraries', 'speaking with the dead', 'academia'],
    appearance: 'A small horse or ass; changes to human form',
  },
  {
    number: 5, name: 'Marbas', rank: 'President',
    domains: ['medicine', 'disease', 'shape-shifting', 'mechanics', 'wisdom'],
    barbarous: 'MARBAS · BARBAS · BARBATOS',
    seal: 'A diamond with internal cross and circular nodes',
    dream_resonance: ['illness', 'healing', 'lions', 'transformation of the body', 'hidden knowledge'],
    appearance: 'A great lion that takes human form upon request',
  },
  {
    number: 6, name: 'Valefor', rank: 'Duke',
    domains: ['cunning', 'thievery', 'temptation', 'familiar spirits'],
    barbarous: 'VALEFOR · MALAPHAR · VALAFAR',
    seal: 'A triangle with lines extending to a cross base',
    dream_resonance: ['theft', 'lions', 'asses', 'deception', 'temptation', 'stolen goods'],
    appearance: 'A lion with an ass\'s head, braying voice',
  },
  {
    number: 7, name: 'Amon', rank: 'Marquis',
    domains: ['reconciliation', 'love', 'past and future', 'strife'],
    barbarous: 'AMON · AAMON · AMAIMON · AMAYMON',
    seal: 'A serpent coiled around a horizontal bar with crown',
    dream_resonance: ['wolves', 'serpents', 'fire', 'reconciliation', 'arguments ending', 'love conflicts'],
    appearance: 'A wolf with a serpent\'s tail, vomiting flames; or a man with dog\'s teeth and raven\'s head',
  },
  {
    number: 8, name: 'Barbatos', rank: 'Duke',
    domains: ['animal speech', 'hidden treasure', 'past and future', 'nature'],
    barbarous: 'BARBATOS · BARBAS · BARBATHOS',
    seal: 'A cross flanked by angular brackets with upper star',
    dream_resonance: ['forests', 'animals speaking', 'buried treasure', 'music', 'nature spirits'],
    appearance: 'Appears when the sun is in Sagittarius; archer in woods with four kings',
  },
  {
    number: 9, name: 'Paimon', rank: 'King',
    domains: ['arts', 'science', 'music', 'philosophy', 'binding', 'obedience'],
    barbarous: 'PAIMON · PAYMON · PAIMONIA · IAO PAIMON',
    seal: 'A crowned cross with circular nodes and angular extensions',
    dream_resonance: ['music', 'dancing', 'crowned figures', 'camel riders', 'knowledge floods', 'teaching'],
    appearance: 'A king crowned upon a camel, preceded by trumpets and cymbals; feminine face',
  },
  {
    number: 10, name: 'Buer', rank: 'President',
    domains: ['logic', 'philosophy', 'herbs', 'healing', 'moral virtues'],
    barbarous: 'BUER · BUELL · BUERR',
    seal: 'A wheel with spokes ending in angular hooks',
    dream_resonance: ['wheels', 'healing', 'philosophical debate', 'herbs and plants', 'virtue'],
    appearance: 'A wheel with the face of a lion at center; five legs for rolling',
  },
  {
    number: 11, name: 'Gusion', rank: 'Duke',
    domains: ['honor', 'dignity', 'reconciliation', 'past and future', 'questions'],
    barbarous: 'GUSION · GUSOIN · GUSAYN',
    seal: 'A circle with internal cross and diamond motif',
    dream_resonance: ['discerning truth', 'reconciling enemies', 'receiving honors', 'distant lands'],
    appearance: 'A cynocephalus (dog-headed man)',
  },
  {
    number: 12, name: 'Sitri', rank: 'Prince',
    domains: ['love', 'lust', 'nakedness', 'passion', 'attraction'],
    barbarous: 'SITRI · SYTRY · BITRU',
    seal: 'A leopard face with wings and a cross beneath',
    dream_resonance: ['erotic dreams', 'nakedness', 'leopards', 'fire', 'passion', 'attraction'],
    appearance: 'A leopard\'s head with gryphon wings; transforms to beautiful man',
  },
  {
    number: 13, name: 'Beleth', rank: 'King',
    domains: ['love', 'passion', 'desire', 'commanding spirits'],
    barbarous: 'BELETH · BILETH · BILET · BYLETH',
    seal: 'A horizontal bar with crown and angular descenders',
    dream_resonance: ['riding horses', 'trumpets', 'fire', 'overwhelming love', 'commanding presence'],
    appearance: 'A terrible king riding a pale horse, preceded by musicians',
  },
  {
    number: 14, name: 'Leraje', rank: 'Marquis',
    domains: ['battles', 'conflict', 'putrefaction of wounds', 'archers'],
    barbarous: 'LERAJE · LERAIE · LERAJER',
    seal: 'An arrow pointing right with three nodes',
    dream_resonance: ['archery', 'battles', 'green clothes', 'wounds', 'conflict resolution'],
    appearance: 'A handsome archer in green, carrying bow and quiver',
  },
  {
    number: 15, name: 'Eligos', rank: 'Duke',
    domains: ['war', 'hidden things', 'future wars', 'attracting favor', 'love of lords'],
    barbarous: 'ELIGOS · ABIGOR · ABIGOR REX',
    seal: 'A lance with serpent above and angular base',
    dream_resonance: ['knights', 'lances', 'snakes', 'hidden secrets revealed', 'favor sought'],
    appearance: 'A goodly knight carrying a lance, banner, and serpent; or a ghost',
  },
  {
    number: 16, name: 'Zepar', rank: 'Duke',
    domains: ['love', 'lust', 'shape-shifting', 'barrenness'],
    barbarous: 'ZEPAR · VEPAR · SEPAR',
    seal: 'A Z-form with angular extensions',
    dream_resonance: ['women', 'soldiers', 'red armor', 'infertility', 'shape-changing lovers'],
    appearance: 'A soldier in red armor',
  },
  {
    number: 17, name: 'Botis', rank: 'President',
    domains: ['past and future', 'reconciling friends', 'enmity resolution'],
    barbarous: 'BOTIS · OTIS · BOTYS',
    seal: 'A viper with horizontal bars',
    dream_resonance: ['vipers', 'reconciliation', 'estranged friends', 'time revealed'],
    appearance: 'An ugly viper; transforms to human with teeth and horns, carrying sword',
  },
  {
    number: 18, name: 'Bathin', rank: 'Duke',
    domains: ['herbs', 'precious stones', 'swift travel', 'knowledge of death'],
    barbarous: 'BATHIN · MATHIM · MARTHIM',
    seal: 'A circle with cross and angular descenders and star',
    dream_resonance: ['swift travel', 'horses', 'herbs', 'gemstones', 'transporting to distant places'],
    appearance: 'A strong man with serpent\'s tail riding a pale horse',
  },
  {
    number: 19, name: 'Sallos', rank: 'Duke',
    domains: ['love', 'passion between men and women', 'peaceful nature'],
    barbarous: 'SALLOS · SALEOS · ZALEOS',
    seal: 'A crescent with angular descenders and cross',
    dream_resonance: ['alligators', 'love affairs', 'soldiers', 'peaceful passion', 'courtship'],
    appearance: 'A gallant soldier riding a crocodile, wearing a ducal crown',
  },
  {
    number: 20, name: 'Purson', rank: 'King',
    domains: ['hidden things', 'past and future', 'finding treasure', 'earthly and divine knowledge'],
    barbarous: 'PURSON · CURSON · PURSAN',
    seal: 'A man\'s face with star, cross, and angular elements',
    dream_resonance: ['lions', 'vipers', 'bearing secrets', 'treasure hunts', 'ancient knowledge'],
    appearance: 'A man with a lion\'s face carrying a viper, riding a bear, preceded by trumpets',
  },
  {
    number: 21, name: 'Morax', rank: 'President',
    domains: ['astronomy', 'liberal sciences', 'herbs', 'precious stones', 'giving familiars'],
    barbarous: 'MORAX · MARAX · FORAII',
    seal: 'A bull head with angular crown',
    dream_resonance: ['astronomy', 'stargazing', 'bulls', 'universities', 'scientific discovery'],
    appearance: 'A great bull with a man\'s face',
  },
  {
    number: 22, name: 'Ipos', rank: 'Prince',
    domains: ['courage', 'wit', 'past and future', 'concealing secrets'],
    barbarous: 'IPOS · IPES · AYPEOS',
    seal: 'An angular cross with four extensions',
    dream_resonance: ['angels', 'lions', 'hares', 'geese', 'courage in fear', 'secrets kept'],
    appearance: 'An angel with lion\'s head, goose\'s feet, and hare\'s tail',
  },
  {
    number: 23, name: 'Aim', rank: 'Duke',
    domains: ['fire', 'cunning', 'witty answers', 'private matters'],
    barbarous: 'AIM · AYM · HABORIM',
    seal: 'A serpent with three stars above',
    dream_resonance: ['fire', 'serpents', 'torches', 'three heads', 'clever answers', 'burning'],
    appearance: 'A handsome man with three heads: serpent, man, cat; carries fire; rides a viper',
  },
  {
    number: 24, name: 'Naberius', rank: 'Marquis',
    domains: ['arts and sciences', 'dignity', 'rhetoric', 'restoring honors'],
    barbarous: 'NABERIUS · NABERUS · CERBERUS',
    seal: 'Three circles with cross above and below',
    dream_resonance: ['crows', 'dogs', 'eloquence', 'lost honors restored', 'speaking in circles'],
    appearance: 'A black crane hopping about; speaks with hoarse voice',
  },
  {
    number: 25, name: 'Glasya-Labolas', rank: 'President',
    domains: ['learning', 'bloodshed', 'making invisible', 'past and future', 'love'],
    barbarous: 'GLASYA-LABOLAS · CAACRINOLAAS · CLASSYALABOLAS',
    seal: 'A dog with angular star above',
    dream_resonance: ['dogs with wings', 'invisibility', 'blood', 'hidden violence', 'swift learning'],
    appearance: 'A dog with gryphon wings; author of all bloodshed',
  },
  {
    number: 26, name: 'Bune', rank: 'Duke',
    domains: ['riches', 'eloquence', 'wisdom', 'changes place of dead', 'gives familiars'],
    barbarous: 'BUNE · BIME · WIERIUS',
    seal: 'A dragon with three stars above',
    dream_resonance: ['dragons', 'cemeteries', 'wealth', 'eloquent speech', 'the honored dead'],
    appearance: 'A three-headed dragon (dog, gryphon, man); speaks with high clear voice',
  },
  {
    number: 27, name: 'Ronove', rank: 'Marquis',
    domains: ['rhetoric', 'languages', 'gaining favor', 'knowledge of enemies'],
    barbarous: 'RONOVE · RONEVE · RONOBE',
    seal: 'A staff with cross and serpent',
    dream_resonance: ['foreign languages', 'persuasion', 'monsters', 'favors from enemies'],
    appearance: 'A monster holding a staff',
  },
  {
    number: 28, name: 'Berith', rank: 'Duke',
    domains: ['transmutation', 'truth', 'past and future', 'turning metals to gold'],
    barbarous: 'BERITH · BEAL · BEALE · BOFRY',
    seal: 'A crowned figure on a horse with angular seal',
    dream_resonance: ['red soldiers', 'gold', 'alchemy', 'lying', 'past victories', 'crowns'],
    appearance: 'A soldier in red clothing and gold crown, riding a red horse',
  },
  {
    number: 29, name: 'Astaroth', rank: 'Duke',
    domains: ['sciences', 'past and future', 'laziness', 'vanity', 'hidden knowledge'],
    barbarous: 'ASTAROTH · ASTEROT · ASTARTE · ASTORETH',
    seal: 'An angel with crown; serpent beneath',
    dream_resonance: ['snakes', 'angels carrying cups of poison', 'vanity', 'ancient wisdom', 'science'],
    appearance: 'A foul angel on a beast, carrying a viper; horrible breath',
  },
  {
    number: 30, name: 'Forneus', rank: 'Marquis',
    domains: ['rhetoric', 'languages', 'fame', 'love of friends and enemies', 'arts'],
    barbarous: 'FORNEUS · FORNEM · FORNEY',
    seal: 'A sea monster with angular crown',
    dream_resonance: ['sea monsters', 'fame sought', 'learning languages', 'being loved by enemies'],
    appearance: 'A great sea monster',
  },
  {
    number: 31, name: 'Foras', rank: 'President',
    domains: ['logic', 'ethics', 'herbs', 'stones', 'invisibility', 'longevity', 'wisdom'],
    barbarous: 'FORAS · FORCAS · FORIX',
    seal: 'A cross with four circular nodes',
    dream_resonance: ['stones', 'herbs', 'invisibility cloaks', 'wisdom quests', 'long life'],
    appearance: 'A strong man in human form',
  },
  {
    number: 32, name: 'Asmodeus', rank: 'King',
    domains: ['lust', 'gambling', 'mathematics', 'astronomy', 'invisibility', 'vengeance'],
    barbarous: 'ASMODEUS · ASMODAY · ASMODI · IAO ASMODAY',
    seal: 'Three circles in a triangle with serpent cross',
    dream_resonance: ['three heads', 'lust', 'gambling', 'fire breathing', 'rings of gambling', 'mathematics'],
    appearance: 'Three heads: bull, man, ram; serpent tail, goose feet; rides a dragon, carries lance and banner',
  },
  {
    number: 33, name: 'Gaap', rank: 'President',
    domains: ['philosophy', 'liberal sciences', 'love', 'hatred', 'making insensible'],
    barbarous: 'GAAP · GOAP · TAP',
    seal: 'An angular symbol with bar and four descenders',
    dream_resonance: ['vast numbers', 'guides', 'philosophy', 'emotional numbing', 'four kings'],
    appearance: 'A man who precedes four mighty kings',
  },
  {
    number: 34, name: 'Furfur', rank: 'Earl',
    domains: ['love', 'thunder', 'lightning', 'storms', 'secret things'],
    barbarous: 'FURFUR · FURTUR · FURFUROS',
    seal: 'A deer with cross and star',
    dream_resonance: ['deer', 'fire tails', 'storms', 'lightning', 'secret love affairs', 'thunder'],
    appearance: 'A hart with fiery tail; speaks only in questions and lies outside triangle',
  },
  {
    number: 35, name: 'Marchosias', rank: 'Marquis',
    domains: ['strength', 'war', 'wrestling', 'answers in truth'],
    barbarous: 'MARCHOSIAS · MARCHOCIAS · MARCHOSIALIS',
    seal: 'A wolf with angular wings above',
    dream_resonance: ['wolves', 'fire breathing', 'gryphon wings', 'strength tested', 'battle'],
    appearance: 'A wolf with gryphon wings; fire breathing; transforms to human man',
  },
  {
    number: 36, name: 'Stolas', rank: 'Prince',
    domains: ['astronomy', 'herbs', 'precious stones', 'knowledge'],
    barbarous: 'STOLAS · STOLOS · SOLAS',
    seal: 'A crown with angular elements',
    dream_resonance: ['owls', 'astronomy', 'herbs', 'gems', 'night birds', 'stargazing'],
    appearance: 'A mighty raven; transforms to man; teaches astronomy',
  },
  {
    number: 37, name: 'Phenex', rank: 'Marquis',
    domains: ['poetry', 'sciences', 'transformation', 'rebirth', 'musical arts'],
    barbarous: 'PHENEX · PHOENIX · PHEYNIX',
    seal: 'A phoenix with wings and star',
    dream_resonance: ['phoenixes', 'fire birds', 'poetry', 'singing', 'rebirth', 'transformation by fire'],
    appearance: 'A phoenix with child\'s voice; transforms to man after time; sings sweetly',
  },
  {
    number: 38, name: 'Halphas', rank: 'Earl',
    domains: ['war', 'towers', 'fortifications', 'ammunition supply'],
    barbarous: 'HALPHAS · MALTHOUS · MALTHAS',
    seal: 'A stork with cross beneath',
    dream_resonance: ['storks', 'towers', 'battlements', 'military logistics', 'sending to wars'],
    appearance: 'A stock dove speaking with hoarse voice',
  },
  {
    number: 39, name: 'Malphas', rank: 'President',
    domains: ['buildings', 'enemies\' knowledge', 'breaking enemies\' strongholds', 'familiars'],
    barbarous: 'MALPHAS · MALPHA · MALPAS',
    seal: 'A raven with angular cross beneath',
    dream_resonance: ['crows', 'raven messages', 'architecture', 'enemy designs revealed', 'building'],
    appearance: 'First a crow; transforms to man with hoarse voice',
  },
  {
    number: 40, name: 'Raum', rank: 'Earl',
    domains: ['destroying dignities', 'past and future', 'love', 'reconciliation'],
    barbarous: 'RAUM · RAYM · RÄUM',
    seal: 'A crow with double descender',
    dream_resonance: ['crows stealing', 'destroyed towns', 'thrones toppled', 'past exposed', 'love after hatred'],
    appearance: 'A crow; transforms to man at request',
  },
  {
    number: 41, name: 'Focalor', rank: 'Duke',
    domains: ['drowning', 'winds and seas', 'overthrowing ships and armies', 'hope of return to heaven'],
    barbarous: 'FOCALOR · FORCALOR · FURCALOR',
    seal: 'A man with gryphon wings on water',
    dream_resonance: ['drowning', 'storms at sea', 'winds', 'overturning', 'hope for redemption'],
    appearance: 'A man with gryphon wings',
  },
  {
    number: 42, name: 'Vepar', rank: 'Duke',
    domains: ['water', 'ships', 'death by drowning', 'infected wounds', 'disease'],
    barbarous: 'VEPAR · VEPHAR · SEPAR',
    seal: 'A mermaid figure with cross',
    dream_resonance: ['mermaids', 'sea guides', 'infected wounds', 'ships in storms', 'water deaths'],
    appearance: 'A mermaid; guides ships laden with arms and ammunition',
  },
  {
    number: 43, name: 'Sabnock', rank: 'Marquis',
    domains: ['afflicting wounds with maggots', 'fortresses', 'besieging cities', 'familiars'],
    barbarous: 'SABNOCK · SABURAC · SABORAC',
    seal: 'An armored soldier with lion head',
    dream_resonance: ['armed soldiers', 'lions', 'horses', 'fortified walls', 'siege', 'decay'],
    appearance: 'An armed soldier with lion\'s head on a pale horse',
  },
  {
    number: 44, name: 'Shax', rank: 'Marquis',
    domains: ['theft', 'deception', 'revelation of hidden things', 'giving familiars'],
    barbarous: 'SHAX · SCOX · CHAX',
    seal: 'A stork with angular base',
    dream_resonance: ['storks', 'poor eyesight', 'deception', 'stolen items returned', 'hearing taken'],
    appearance: 'A stock dove speaking with hoarse voice; takes away hearing, sight, understanding',
  },
  {
    number: 45, name: 'Vine', rank: 'King',
    domains: ['divination', 'sorcery', 'building towers', 'destroying walls', 'discovering witches'],
    barbarous: 'VINE · VINEA · VINNÉ',
    seal: 'A lion head with cross and crown',
    dream_resonance: ['lions', 'adders', 'vineyards', 'prophecy', 'ruins', 'witchcraft revealed'],
    appearance: 'A lion with adder\'s tail on a black horse, carrying a viper',
  },
  {
    number: 46, name: 'Bifrons', rank: 'Earl',
    domains: ['astrology', 'geometry', 'arts', 'herbs', 'moving dead bodies', 'candles on graves'],
    barbarous: 'BIFRONS · BIFROUS · BIFROVS',
    seal: 'Two-faced figure with angular elements',
    dream_resonance: ['graveyards', 'two-faced creatures', 'candles', 'geometry', 'the honored dead moved'],
    appearance: 'A monster; transforms to a man; lights fires on graves',
  },
  {
    number: 47, name: 'Uvall', rank: 'Duke',
    domains: ['love', 'reconciliation', 'past and future', 'procuring friends'],
    barbarous: 'UVALL · VUAL · VOVAL',
    seal: 'An angular dromedary sigil',
    dream_resonance: ['dromedaries', 'Egyptian language', 'love brought together', 'friends made from enemies'],
    appearance: 'A dromedary; transforms to man; speaks Egyptian; loves Amon',
  },
  {
    number: 48, name: 'Haagenti', rank: 'President',
    domains: ['making wise', 'turning metals to gold', 'water to wine', 'wisdom'],
    barbarous: 'HAAGENTI · HAAGENTY · AGENTI',
    seal: 'A bull with gryphon wings',
    dream_resonance: ['bulls with wings', 'transmutation', 'wine', 'alchemy', 'becoming wise'],
    appearance: 'A bull with gryphon wings; transforms to man at request',
  },
  {
    number: 49, name: 'Crocell', rank: 'Duke',
    domains: ['geometry', 'liberal sciences', 'finding baths and waters', 'sounds'],
    barbarous: 'CROCELL · CROKEL · PROCELL',
    seal: 'An angular symbol with three nodes',
    dream_resonance: ['water sounds', 'bathing', 'hidden springs', 'geometry', 'rushing water'],
    appearance: 'An angel; speaks of hidden and secret things',
  },
  {
    number: 50, name: 'Furcas', rank: 'Knight',
    domains: ['philosophy', 'astronomy', 'rhetoric', 'logic', 'chiromancy', 'pyromancy'],
    barbarous: 'FURCAS · FORCAS · FURKAS',
    seal: 'A spear with cross and star',
    dream_resonance: ['cruel old men', 'horses', 'spears', 'palm reading', 'fire divination'],
    appearance: 'A cruel old man with long beard on pale horse, carrying spear',
  },
  {
    number: 51, name: 'Balam', rank: 'King',
    domains: ['invisibility', 'wit', 'past and future', 'finesse'],
    barbarous: 'BALAM · BALAAM · BALIM',
    seal: 'Three heads with serpent tail above cross',
    dream_resonance: ['three-headed beings', 'serpent tails', 'riding bears', 'humor', 'invisibility'],
    appearance: 'Three heads: bull, man, ram; serpent\'s tail, eyes of flame; rides a bear carrying hawk',
  },
  {
    number: 52, name: 'Alloces', rank: 'Duke',
    domains: ['astronomy', 'liberal sciences', 'familiars', 'war victories'],
    barbarous: 'ALLOCES · ALLOCER · ALOCAS',
    seal: 'A lion head with angular crown',
    dream_resonance: ['lion faces', 'fiery eyes', 'horses', 'astronomy lessons', 'battle victories'],
    appearance: 'A soldier with lion\'s face and fiery eyes on a great horse; speaks hoarsely',
  },
  {
    number: 53, name: 'Camio', rank: 'President',
    domains: ['bird speech', 'waters and animals', 'omens', 'understanding'],
    barbarous: 'CAMIO · CAIM · CAHIM',
    seal: 'A thrush with angular bar',
    dream_resonance: ['birds speaking', 'thrushes', 'coals of fire', 'animal omens', 'understanding nature'],
    appearance: 'A thrush; transforms to man with sharp sword; answers in burning ashes',
  },
  {
    number: 54, name: 'Murmur', rank: 'Duke',
    domains: ['philosophy', 'binding souls of the dead', 'necromancy', 'music'],
    barbarous: 'MURMUR · MURMUS · MURMUX',
    seal: 'A crowned soldier with griffin wings',
    dream_resonance: ['soldiers on griffins', 'trumpets', 'the dead summoned', 'philosophy', 'music of spheres'],
    appearance: 'A soldier on a vulture or griffin, with ducal crown; preceded by trumpets',
  },
  {
    number: 55, name: 'Orobas', rank: 'Prince',
    domains: ['past and future', 'divinity and creation', 'dignity and prelacy', 'truth', 'friendship'],
    barbarous: 'OROBAS · OROBAAS · OROBASE',
    seal: 'A horse head with angular crown',
    dream_resonance: ['horses', 'prophecy', 'divine creation', 'friendship stable', 'promotion'],
    appearance: 'A horse; transforms to human at request; faithful and will not suffer spirits to mislead',
  },
  {
    number: 56, name: 'Gremory', rank: 'Duke',
    domains: ['past and future', 'treasure finding', 'procuring love of women', 'friendship'],
    barbarous: 'GREMORY · GAMORI · GOMORY',
    seal: 'A woman on a camel with crown above',
    dream_resonance: ['women on camels', 'buried treasure', 'love of women', 'camel journeys'],
    appearance: 'A beautiful woman with duchess\' crown, riding a camel',
  },
  {
    number: 57, name: 'Ose', rank: 'President',
    domains: ['liberal sciences', 'making mad', 'shape-shifting', 'illusions'],
    barbarous: 'OSE · VOSO · OSO',
    seal: 'A leopard with angular elements',
    dream_resonance: ['madness', 'shape-shifting', 'illusions of form', 'leopards', 'answering truthfully'],
    appearance: 'A leopard; transforms to man at request',
  },
  {
    number: 58, name: 'Amy', rank: 'President',
    domains: ['liberal sciences', 'finding familiar spirits', 'treasure by spirits', 'astrology'],
    barbarous: 'AMY · AVNAS · AVNER',
    seal: 'A circle with internal star and cross',
    dream_resonance: ['flaming fire', 'treasure maps', 'astrology studied', 'familiar spirits sought'],
    appearance: 'Appears first as a flaming fire; transforms to man',
  },
  {
    number: 59, name: 'Oriax', rank: 'Marquis',
    domains: ['virtues of planets', 'mansions of stars', 'transformation', 'favor of friends and foes'],
    barbarous: 'ORIAX · ORIAS · NAAS',
    seal: 'A lion rider with serpent tail',
    dream_resonance: ['lions', 'vipers in hand', 'stars as mansions', 'planetary virtues', 'transformation'],
    appearance: 'A great lion on a strong horse, carrying two serpents; fiery eyes',
  },
  {
    number: 60, name: 'Vapula', rank: 'Duke',
    domains: ['philosophy', 'mechanics', 'sciences', 'crafts', 'professions'],
    barbarous: 'VAPULA · NAPHULA · NAPHULAH',
    seal: 'A lion with gryphon wings',
    dream_resonance: ['lions with wings', 'craft mastery', 'philosophical discussion', 'working with hands'],
    appearance: 'A lion with gryphon wings',
  },
  {
    number: 61, name: 'Zagan', rank: 'King',
    domains: ['transmutation', 'making witty', 'turning water/blood to wine', 'turning metal to coin'],
    barbarous: 'ZAGAN · ZAGANE · ZAAGAN',
    seal: 'A bull with gryphon wings and crown',
    dream_resonance: ['bulls with wings', 'wine', 'alchemy', 'clever wit', 'transformation of substance'],
    appearance: 'A bull with gryphon wings; transforms to man at request',
  },
  {
    number: 62, name: 'Valac', rank: 'President',
    domains: ['finding treasure', 'serpents', 'revelation of hidden things'],
    barbarous: 'VALAC · VOLAC · VALAK',
    seal: 'A small boy with angel wings',
    dream_resonance: ['small winged children', 'serpents', 'treasure hidden underground', 'two-headed dragons'],
    appearance: 'A small boy with angel\'s wings on a two-headed dragon',
  },
  {
    number: 63, name: 'Andras', rank: 'Marquis',
    domains: ['sowing discord', 'killing masters and servants', 'conflict'],
    barbarous: 'ANDRAS · ANDROAS · ANDARAS',
    seal: 'An angel head on a raven with sword',
    dream_resonance: ['ravens with angel heads', 'wolves riding', 'swords', 'discord', 'masters and servants'],
    appearance: 'An angel\'s head with raven\'s body, riding a wolf; carries a sharp sword',
  },
  {
    number: 64, name: 'Haures', rank: 'Duke',
    domains: ['destroying enemies', 'past and future', 'love and true answers', 'burning enemies'],
    barbarous: 'HAURES · FLAUROS · HAURAS',
    seal: 'A leopard with star and cross',
    dream_resonance: ['leopards', 'fire consuming', 'enemies destroyed', 'past divulged', 'truth reluctantly given'],
    appearance: 'A leopard; transforms to human with fiery eyes and terrible countenance',
  },
  {
    number: 65, name: 'Andrealphus', rank: 'Marquis',
    domains: ['geometry', 'astronomy', 'mathematics', 'cunning transformation', 'measuring'],
    barbarous: 'ANDREALPHUS · ANDREALP · ANDREAL',
    seal: 'A peacock with angular cross',
    dream_resonance: ['peacocks', 'measurement', 'geometry', 'transformation to bird form', 'astronomy'],
    appearance: 'A loud peacock; transforms to man; teaches measurement and astronomy',
  },
  {
    number: 66, name: 'Cimeies', rank: 'Marquis',
    domains: ['grammar', 'logic', 'rhetoric', 'valor', 'finding lost things'],
    barbarous: 'CIMEIES · KIMARIS · CIMEJES',
    seal: 'A warrior on a horse with cross',
    dream_resonance: ['black horses', 'Africa', 'valor', 'grammar mastered', 'lost things in sand'],
    appearance: 'A warrior on a black horse; rules Africa; finds things lost in sand',
  },
  {
    number: 67, name: 'Amdusias', rank: 'Duke',
    domains: ['music', 'commanding spirits', 'bending trees', 'musical instruments heard without sight'],
    barbarous: 'AMDUSIAS · AMDUKIAS · AMBDUSCIAS',
    seal: 'A unicorn with angular crown',
    dream_resonance: ['unicorns', 'invisible music', 'trees bending', 'orchestras without musicians'],
    appearance: 'A unicorn; transforms to human at request; causes musical instruments to play invisibly',
  },
  {
    number: 68, name: 'Belial', rank: 'King',
    domains: ['power', 'favor', 'senators', 'distributing presentations', 'declarations'],
    barbarous: 'BELIAL · BELIAR · BELIALL · IAO BELIAL',
    seal: 'A crowned figure with serpent below',
    dream_resonance: ['two angels in fire', 'senators', 'gifts from authorities', 'vice', 'liberation'],
    appearance: 'Two beautiful angels sitting in a chariot of fire; speaks sweetly',
  },
  {
    number: 69, name: 'Decarabia', rank: 'Marquis',
    domains: ['herbs', 'stones', 'birds', 'familiars in bird form', 'singing'],
    barbarous: 'DECARABIA · CARABIA · OCARABIA',
    seal: 'A pentagram with central star and cross',
    dream_resonance: ['stars', 'birds singing', 'herbs discovered', 'pentagrams', 'familiar birds'],
    appearance: 'Appears as a star in a pentacle; transforms to man; discovers virtues of birds and stones',
  },
  {
    number: 70, name: 'Seere', rank: 'Prince',
    domains: ['swift travel', 'abundance', 'harvest', 'finding things', 'indifferent to good or evil'],
    barbarous: 'SEERE · SEAR · SEIR',
    seal: 'A man on a winged horse',
    dream_resonance: ['winged horses', 'swift journeys', 'abundance', 'harvest', 'neutrality'],
    appearance: 'A beautiful man on a winged horse; benevolent indifferent nature',
  },
  {
    number: 71, name: 'Dantalion', rank: 'Duke',
    domains: ['minds of all men and women', 'teaching arts and sciences', 'love', 'changing minds'],
    barbarous: 'DANTALION · DANTALIAN · DANTAYION',
    seal: 'A man with many faces, holding a book',
    dream_resonance: ['many faces on one head', 'reading minds', 'all faces of humanity', 'changing hearts', 'books'],
    appearance: 'A man with many faces (all men\'s and women\'s), carrying a book; reads minds',
  },
  {
    number: 72, name: 'Andromalius', rank: 'Earl',
    domains: ['punishing thieves', 'discovering wickedness', 'detecting fraud', 'returning stolen goods'],
    barbarous: 'ANDROMALIUS · ANDROMALI · ANDOROMALIUS',
    seal: 'A man holding a serpent',
    dream_resonance: ['serpents held', 'stolen goods returned', 'thieves caught', 'fraud revealed', 'justice'],
    appearance: 'A man holding a great serpent; returns stolen goods; punishes all thieves and wicked men',
  },
]

// Primary invocation formula from the PGM (Greek Magical Papyri)
// Used as opening/closing framing for any Goetic working
export const PGM_INVOCATION = {
  opening: 'IAO · SABAOTH · ADONAI · ABRASAX',
  barbarous_of_barbarous: 'AKRAMMACHAMAREI · PHNOUM · PHORBA · PHORBAS',
  closing: 'AEEIOUŌ · AEĒIOUŌ · AEĒIOUO',
}

// The four demonic kings presiding over cardinal directions
export const CARDINAL_KINGS = {
  east: 'Oriens',
  west: 'Amaymon',
  south: 'Paimon',
  north: 'Egyn',
}

// Find a spirit by name (case-insensitive)
export function getSpiritByName(name: string): GoetiaSpirit | undefined {
  return SPIRITS.find(s => s.name.toLowerCase() === name.toLowerCase())
}

// Find spirits resonant with given dream themes/symbols
export function findResonantSpirits(themes: string[], symbols: string[], limit = 3): GoetiaSpirit[] {
  const query = [...themes, ...symbols].map(s => s.toLowerCase())
  const scored = SPIRITS.map(spirit => {
    const resonance = spirit.dream_resonance.map(r => r.toLowerCase())
    const domainWords = spirit.domains.join(' ').toLowerCase()
    let score = 0
    for (const q of query) {
      for (const r of resonance) {
        if (r.includes(q) || q.includes(r)) score += 2
      }
      if (domainWords.includes(q)) score += 1
    }
    return { spirit, score }
  })
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.spirit)
}
