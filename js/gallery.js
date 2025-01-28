// Data for gallery items
const galleryItems = [
  {
    title: 'Floral Guardian',
    image: 'images/gallery-1.jpg', // Path to image
    description: 'A vibrant bull with a green body and purple mane holds a red flower high, standing proudly on a branch. Surrounded by a burst of colorful blooms and leaves, it commands attention against a stark white background.'
  },
  {
    title: 'Floral Exchange by Tribal Women',
    image: 'images/gallery-2.jpg', // Path to image
    description: 'A tribal woman in a white dress sells flowers against a vibrant backdrop, capturing the essence of village life in bold, sketchy strokes.'
  },
  {
    title: 'Bull Cultivating Vibrance',
    image: 'images/gallery-3.jpg', // Path to image
    description: 'An abstract painting depicting a vibrant bull engaged in cultivation, symbolizing growth and prosperity through a dynamic play of colors and shapes.'
  },
  {
    title: 'Meeting of Majestic Peacocks',
    image: 'images/gallery-4.jpg', // Path to image
    description: 'Two peacocks engage in a serene exchange, their elegant posture reflecting a quiet, mutual understanding.'
  },
  {
    title: "Whispers of the Fish",
    image: "images/gallery-5.jpg",
    description: "In a world where dreams merge with reality, she sits gracefully on a branch of life, her thoughts swimming amidst the vibrant whispers of the fish, suspended in a moment where nature's wonders meet the surreal."
  },
  {
    title: "Branch of Life",
    image: "images/gallery-6.jpg",
    description: "Amidst the vibrant embrace of nature, the white cow stands poised on a branch, a silent guardian of the lively chorus of birds. The scene pulses with the rhythm of life, where every creature and leaf plays its part in the grand tapestry of existence."
  },
  {
    title: "The Silent Blossom",
    image: "images/gallery-7.jpg",
    description: "In a world of vivid colors and flowing shapes, she becomes the canvas, her essence intertwined with the wings of birds. Each hue and form tells a story of freedom and unity, where the abstract meets the tangible in a dance of life and color."
  },
  {
    title: "Silent Companions",
    image: "images/gallery-8.jpg",
    description: "In a vibrant embrace of nature, the person and cow lie side by side, their connection a quiet testament to the bond between living beings. Amidst a backdrop of lush greenery and lively colors, their shared moment speaks of peace and harmony, where the world fades away and only their companionship remains."
  },
  {
    title: "Nature’s Serenade",
    image: "images/gallery-9.jpg",
    description: "Amidst a vibrant tapestry of life, the deer stands as the gentle guardian, a yellow flower gracing its back. A peacock and butterfly, each a burst of color, dance nearby, as the forest hums with quiet beauty. Together, they create a serene symphony of nature's wonders."
  },
  {
    title: "Gallop of Freedom",
    image: "images/gallery-10.jpg",
    description: "In a burst of motion, the horse surges forward, a powerful blend of brown and black against a whirlwind of vibrant colors. The abstract background swirls with green, blue, and orange, capturing the untamed spirit of the wild. This dynamic scene is a testament to the raw energy and freedom that only a galloping horse can embody."
  },
  {
    title: "Celestial Surge",
    image: "images/gallery-11.jpg",
    description: "The white horse leaps through a monochrome world, its flowing mane a symbol of unbridled energy. Against a vibrant sky of colors, with birds in vivid flight and a palm tree swaying, the scene captures the exhilarating rush of freedom and the beauty of the boundless horizon."
  },
  {
    title: "Dual Reverie",
    image: "images/gallery-12.jpg",
    description: "In a realm of vibrant contrasts, two horses emerge: one brown with fiery red and yellow stripes, the other blue adorned with green and yellow. Their striking forms stand out against a kaleidoscopic backdrop of blues, greens, and fiery splashes, evoking a dreamscape where color and imagination run wild."
  },
  {
    title: "Roots of Imagination",
    image: "images/gallery-13.jpg",
    description: "A majestic tree, with its rich brown trunk and vibrant green leaves, anchors the scene, its roots reaching into the canvas's depths. Surrounded by whimsical elements—a pink building, a yellow bird, and a purple flower—this abstract composition celebrates the harmony of nature and imagination against a pristine white backdrop."
  },
  {
    title: "Hero’s Prism",
    image: "images/gallery-14.jpg",
    description: "In a burst of colors, a figure in a bold blue robe commands attention, sword raised in a moment of poised strength. Surrounded by a vibrant cast of yellow, green, and pink forms, the scene unfolds against a rich tapestry of green and pink, blending bravery with the kaleidoscope of dreams."
  },
  {
    title: "Celestial Steed and Aviary",
    image: "images/gallery-15.jpg",
    description: "In an otherworldly realm, a majestic horse in vivid orange and brown stands poised, its mane and tail rippling like ethereal flames. Surrounding it, a vibrant flurry of birds in green, blue, and purple weave through the air, some perched upon the horse, as if sharing tales of a fantastical journey. Framed by a bold black border, this scene captures a timeless moment of grace and wonder."
  },
  {
    title: "Enchanted Menagerie",
    image: "images/gallery-16.jpg",
    description: "In a whimsical sketch, a black cow stands center stage, its gaze gentle and curious. To the left, a pink bird perches on a branch, while a black cat rests on a green plant, its tail curled around itself. The background brims with lively details—a blue fish, a pink flower, and more—creating a playful narrative where each character adds its own touch to the magical tableau."
  },
  {
    title: "Abstract Grazing",
    image: "images/gallery-17.jpg",
    description: "In a vibrant dreamscape, a cow with a whimsical pink and purple tail roams through a meadow of abstract blooms. Each flower, in hues of pink, purple, and gold, seems to sing a silent melody as the cow, outlined in bold lines, moves through a world where colors and patterns dance together in harmony."
  },
  {
    title: "Wildlife Interlude",
    image: "images/gallery-18.jpg",
    description: "In this art brought to life with vibrant hues, a cow, a bird, and a horse mingle amidst a lively tapestry of plants. The warm oranges and reds of the animals contrast with the cool blues and greens of their surroundings, while green leaves and brown trunks anchor the scene. From a unique perspective, they appear to interact in a harmonious dance, capturing a moment where nature’s rhythms blend seamlessly."
  },
  {
    title: "Watchful Wanderer",
    image: "images/gallery-19.jpg",
    description: "A monkey, frozen in a dynamic pose, eyes an unseen secret beyond the frame. Its dark fur stands out against a light beige background, capturing a moment of focused curiosity."
  },
  {
    title: "The Horse Amidst Blooming Splendor",
    image: "images/gallery-20.jpg",
    description: "A vibrant horse stands amidst a lush tapestry of plants and flowers, its brown coat contrasting against a vivid backdrop."
  },
  {
    title: "Crimson Sentinel",
    image: "images/gallery-21.jpg",
    description: "A vibrant red bull with a white face dominates the scene, surrounded by a swirl of colorful figures. The dynamic arrangement of a red-haired woman, a green and red man, and a pink and green woman creates a lively burst of energy against a stark white backdrop."
  },
  {
    title: "Equine Blossom",
    image: "images/gallery-22.jpg",
    description: "In a whimsical garden, a brown horse roams serenely among pink and purple blooms, its gaze fixed on a towering blue tree with green branches. As the scene unfolds, the horse and tree weave a quiet tale of harmony amidst the vibrant tapestry of nature."
  },
  {
    title: "Tranquil Bull",
    image: "images/gallery-23.jpg",
    description: "In a vibrant realm, a bull in shades of orange, purple, and green rests serenely, its majestic antlers framing a peaceful scene. Reclining against a backdrop of rich greens and blues, it embodies a tranquil moment amidst a tapestry of leaves and flowers."
  },
  {
    title: "Dynamic Fusion",
    image: "images/gallery-24.jpg",
    description: "In a burst of abstract brilliance, a brown cow, green tree, and red bird engage in a dance across a vivid landscape of blue and green. Their interplay of shapes and colors weaves a tale of lively movement and interaction, captured in a striking collage that bursts with depth and energy."
  },
  {
    title: "Colorful Cavalier",
    image: "images/gallery-25.jpg",
    description: "Amidst a stark white canvas, a horse adorned with a green hat and white scarf stands in vivid shades of orange, pink, and green. Positioned centrally and facing right, it brings a whimsical burst of color and character to the scene."
  },
  {
    title: "Melodic Harmony",
    image: "images/gallery-26.jpg",
    description: "A guitar, painted in vivid reds, blues, and greens, leans gracefully to the left, its neck reaching skyward. Set against a crisp white backdrop, it becomes a vibrant centerpiece surrounded by a bird, a flower, and a sun, together crafting a visual symphony of color and melody."
  },
  {
    title: "Peaceful Pasture",
    image: "images/gallery-27.jpg",
    description: "On a tranquil hill, a brown goat lies contentedly while a white goat stands watchful. Surrounded by a lush green field and gentle trees, this loose, sketchy painting in bold blues, greens, and yellows captures a serene moment of quiet companionship."
  },
  {
    title: "Masked Melodies",
    image: "images/gallery-28.jpg",
    description: "Amidst a burst of tropical colors, a masked man holds a guitar, blending into a vibrant tapestry of lush plants and bold flowers. The stark white background accentuates the lively interplay of hues, capturing a moment of musical mystery in a lively garden scene."
  },
  {
    title: "Vibrant Currents",
    image: "images/gallery-29.jpg",
    description: "In a whirl of blue, orange, green, and purple, dynamic shapes and curves flow across the canvas, evoking a sense of energetic movement. Framed by a crisp white border, this modern abstract piece bursts with life and rhythm, capturing the essence of vibrant expression."
  },
  {
    title: "Colorful Trio",
    image: "images/gallery-30.jpg",
    description: "A vibrant abstract scene unfolds with a brown and black horse on the left, a person in blue and red outstretched at the center, and a blue and green bird to the right. Set against a lush green backdrop of trees and foliage, this lively composition blends shapes and colors into a dynamic visual narrative."
  },
  {
    title: "Animated Grace",
    image: "images/gallery-31.jpg",
    description: "In a vibrant scene, a brown cow charges forward with raised horns, while a woman in a red dress cradles a white bird. Set against a lush green backdrop of trees and foliage, the abstract lines and bold colors capture a dynamic dance of energy and grace."
  },
  {
    title: "Elegance Amidst Tropics",
    image: "images/gallery-32.jpg",
    description: "A graceful woman with a necklace and earrings gazes thoughtfully to the left, surrounded by a lush burst of tropical plants and flowers in vibrant greens, blues, and pinks. The stark white background enhances her elegance and the dynamic abstract forms that bring the scene to life."
  },
  {
    title: "Vivid Menagerie",
    image: "images/gallery-33.jpg",
    description: "A green horse adorned with pink and orange patterns stands proudly as a peacock fans its vibrant blue and green feathers nearby. An orange and yellow bird soars between them, all set against a stark white backdrop that amplifies their lively colors and abstract forms."
  },
  {
    title: "Chromatic Whirl",
    image: "images/gallery-34.jpg",
    description: "In a swirl of vivid reds, oranges, and blues, abstract shapes dance across the canvas, creating a vibrant symphony of color. Each hue pulses with energy, drawing the viewer into a lively world where form gives way to pure emotion."
  },
  {
    title: "Forest Harmony",
    image: "images/gallery-35.jpg",
    description: "In a vibrant woodland, a cow stands proudly beneath a green canopy, while a parrot and bird perch playfully on nearby branches. The sky above stretches blue and wide, embracing the lively scene below. Each creature adds its unique voice to the forest’s symphony, creating a colorful tapestry of life and connection."
  },
  {
    title: "Weightless Stillness",
    image: "images/gallery-36.jpg",
    description: "In a world of black and white, a woman drifts through the void, her form suspended in the air. Her limbs extend freely, embracing the emptiness around her. The simplicity of the lines captures a moment of serene solitude, where time and space seem to dissolve, leaving only the pure essence of her graceful, floating figure."
  },
  {
    title: "Threads of Unity",
    image: "images/gallery-37.jpg",
    description: "Three figures reach out, their forms interwoven in a dance of lines and curves. The central figure anchors the trio, their outstretched arms bridging the gap between them. Each stroke of black ink captures a fleeting moment of connection, where individuality merges into a shared embrace."
  },
  {
    title: "Restful Companions",
    image: "images/gallery-38.jpg",
    description: "Three goats find solace in each other’s presence, their forms sketched with ease and grace. One lies peacefully on the ground, while the others stand close, as if sharing a quiet moment. The simplicity of the lines speaks of contentment, capturing a fleeting scene of quiet camaraderie."
  },
  {
    title: "Whispers in the Meadow",
    image: "images/gallery-39.jpg",
    description: "In a quiet meadow, four goats bask in the warmth of the day. Their simple forms, drawn with gentle lines, capture a fleeting moment of peace. Some stand, others rest, all sharing in the calm that surrounds them. The artist’s touch brings light and shadow into play, adding depth to this serene scene where nature’s tranquility reigns."
  },
  {
    title: "Tales of the Tropics",
    image: "images/gallery-41.jpg",
    description: "In a lush tropical haven, a woman in pink and blue stands poised, clutching a brown pot. Behind her, a blue boat rests amid the palms, the scene alive with color and movement as she readies herself for the journey ahead."
  },
  {
    title: "Visionary Dreamscape",
    image: "images/gallery-42.jpg",
    description: "In a realm of dreams, a watchful eye surveys a surreal world. Amidst abstract forms, a meditative figure finds serenity, while a bird and a tree weave through the tangled lines of this enigmatic vision."
  },
];

// Function to dynamically generate gallery items in grid layout
function generateGallery() {
  const galleryWrapper = document.querySelector('.gallery-grid');

  // const isHomepage = window.location.pathname.endsWith('index.html');

  // Determine how many items to show: 4 for homepage, all for other pages
  // const itemsToDisplay = isHomepage ? galleryItems.slice(0, 4) : galleryItems;

  galleryItems.forEach(item => {
    // Create the HTML for each gallery item in a grid column
    const galleryItem = document.createElement('div');
    galleryItem.classList.add('col-md-4', 'mb-4'); // 3 columns layout on medium screens

    galleryItem.innerHTML = `
      <div class="product-card">
        <div class="card-detail d-flex justify-content-between align-items-baseline pt-3">
          <h3 class="card-title text-uppercase">${item.title}</h3>
        </div>
        <div class="image-overlay position-relative">
          <div class="product-image">
            <img src="${item.image}" alt="${item.title}" class="product-image img-fluid">
            <div class="text-box box-slide position-absolute">
              <div class="text-content p-5 bg-light">
                <h3>About Art</h3>
                <p>${item.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Append the generated item to the gallery container
    galleryWrapper.appendChild(galleryItem);
  });
}

// Call the function to generate the gallery when the page loads
window.onload = generateGallery;
