document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════
     DOM REFS
  ══════════════════════════════════════ */
  const generateBtn       = document.getElementById('generate-btn');
  const ingredientsInput  = document.getElementById('ingredients');
  const resultsSection    = document.getElementById('results');
  const recipeOutput      = document.getElementById('recipe-output');
  const tipsOutput        = document.getElementById('tips-output');
  const badgeCalories     = document.getElementById('badge-calories');
  const badgeProtein      = document.getElementById('badge-protein');
  const badgeFats         = document.getElementById('badge-fats');

  // Navbar
  const navbar    = document.getElementById('navbar');
  const navBurger = document.getElementById('nav-burger');
  const navLinks  = document.querySelector('.nav-links');

  // Upload / gallery
  const uploadZone        = document.getElementById('upload-zone');
  const imageInput        = document.getElementById('image-input');
  const uploadBrowse      = document.getElementById('upload-browse');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const imgGallery        = document.getElementById('img-gallery');
  const cvBadge           = document.getElementById('cv-badge');
  const cvStatus          = document.getElementById('cv-status');

  // Tag chips (sidebar section)
  const tagsSection       = document.getElementById('tags-section');
  const tagsContainer     = document.getElementById('tags-container');
  const addTagBtn         = document.getElementById('add-tag-btn');
  const addTagInputWrap   = document.getElementById('add-tag-input-wrap');
  const addTagInput       = document.getElementById('add-tag-input');

  // Inline chips + detection warning (below textarea)
  const inlineChips       = document.getElementById('inline-chips');
  const detectionWarning  = document.getElementById('detection-warning');

  /* ══════════════════════════════════════
     STATE
  ══════════════════════════════════════ */
  let uploadedFiles = [];   // Array of { file, objectUrl } objects
  let detectedTags  = [];   // Current chip ingredient list

  /* ══════════════════════════════════════
     SMART IMAGE MAPPING SIMULATION
     ─────────────────────────────────────
     NOTE: This function simulates a backend multimodal LLM call
     (e.g. IBM Granite Vision API or GPT-4 Vision) for the purposes
     of this conceptual prototype / demo presentation.
     In production, this would be a real API request:
       POST /api/vision  { image: <base64> }
       → { ingredients: ['Potato', 'Tomato', 'Carrot', 'Beetroot'] }

     The Smart Image Mapping approach works in two stages:
       1. Filename keyword scan — if the filename hints at a food category
          (e.g. "salad.jpg", "curry_dish.png"), return the best matching
          curated ingredient set for a flawless demo.
       2. Random curated set fallback — always returns a coherent, realistic
          group of 4–5 ingredients that work well together in a recipe,
          never single oddly-detected words like 'egg' or 'plate'.
     The 1.5-second delay replicates real API latency.
  ══════════════════════════════════════ */

  /**
   * Curated ingredient sets — each entry is a coherent group that produces
   * a great recipe. Mapped to filename keywords for instant demo accuracy.
   */
  // The canonical multi-vegetable stock-photo set — returned for generic
  // filenames (img, photo, picture, screenshot, dsc, etc.) and as the
  // first fallback so the demo ALWAYS works with common test files.
  const ROOT_VEG_SET = ['Potato', 'Tomato', 'Carrot', 'Beetroot', 'Mushroom'];

  const SMART_INGREDIENT_SETS = {
    // Generic / camera filenames → multi-vegetable stock photo set
    img:          ROOT_VEG_SET,
    image:        ROOT_VEG_SET,
    photo:        ROOT_VEG_SET,
    picture:      ROOT_VEG_SET,
    screenshot:   ROOT_VEG_SET,
    dsc:          ROOT_VEG_SET,
    dscf:         ROOT_VEG_SET,
    img_:         ROOT_VEG_SET,
    download:     ROOT_VEG_SET,
    untitled:     ROOT_VEG_SET,
    test:         ROOT_VEG_SET,
    stock:        ROOT_VEG_SET,
    vegetable:    ROOT_VEG_SET,
    vegetables:   ROOT_VEG_SET,
    veggies:      ROOT_VEG_SET,
    // Named food keywords → exact curated sets
    curry:        ['Potato', 'Tomato', 'Onion', 'Garlic', 'Ginger'],
    paneer:       ['Paneer', 'Tomato', 'Onion', 'Garlic', 'Spinach'],
    spinach:      ['Spinach', 'Paneer', 'Onion', 'Garlic', 'Ginger'],
    chicken:      ['Chicken', 'Spinach', 'Onion', 'Garlic', 'Tomato'],
    salad:        ['Cucumber', 'Tomato', 'Avocado', 'Lettuce', 'Lemon'],
    soup:         ['Carrot', 'Pumpkin', 'Onion', 'Garlic', 'Ginger'],
    dal:          ['Lentils', 'Tomato', 'Onion', 'Garlic', 'Ginger'],
    veggie:       ['Broccoli', 'Carrot', 'Bell Pepper', 'Onion', 'Garlic'],
    fruit:        ['Apple', 'Banana', 'Lemon', 'Ginger', 'Almonds'],
    apple:        ['Apple', 'Almonds', 'Ginger', 'Lemon', 'Banana'],
    potato:       ['Potato', 'Tomato', 'Carrot', 'Beetroot', 'Mushroom'],
    tomato:       ['Tomato', 'Onion', 'Garlic', 'Bell Pepper', 'Spinach'],
    carrot:       ['Carrot', 'Potato', 'Beetroot', 'Onion', 'Ginger'],
    beetroot:     ['Beetroot', 'Carrot', 'Potato', 'Onion', 'Ginger'],
    mushroom:     ['Mushroom', 'Potato', 'Carrot', 'Tomato', 'Onion'],
    avocado:      ['Avocado', 'Cucumber', 'Tomato', 'Lemon', 'Lettuce'],
    broccoli:     ['Broccoli', 'Carrot', 'Garlic', 'Onion', 'Bell Pepper'],
    lentil:       ['Lentils', 'Tomato', 'Onion', 'Garlic', 'Ginger'],
    chickpea:     ['Chickpeas', 'Tomato', 'Onion', 'Garlic', 'Spinach'],
    pumpkin:      ['Pumpkin', 'Ginger', 'Onion', 'Carrot', 'Garlic'],
    tofu:         ['Tofu', 'Bell Pepper', 'Broccoli', 'Garlic', 'Onion'],
  };

  /**
   * Fallback pools — used when filename has no keyword match.
   * The ROOT_VEG_SET is first so unnamed test photos always produce a
   * great multi-vegetable result.
   */
  const FALLBACK_SETS = [
    ROOT_VEG_SET,
    ['Paneer', 'Spinach', 'Tomato', 'Onion', 'Garlic'],
    ['Chicken', 'Spinach', 'Onion', 'Garlic', 'Ginger'],
    ['Lentils', 'Tomato', 'Onion', 'Garlic', 'Ginger'],
    ['Mushroom', 'Bell Pepper', 'Onion', 'Garlic', 'Spinach'],
    ['Broccoli', 'Carrot', 'Garlic', 'Onion', 'Ginger'],
    ['Avocado', 'Cucumber', 'Tomato', 'Lemon', 'Lettuce'],
    ['Chickpeas', 'Tomato', 'Onion', 'Garlic', 'Spinach'],
    ['Pumpkin', 'Ginger', 'Onion', 'Carrot', 'Garlic'],
    ['Apple', 'Almonds', 'Banana', 'Ginger', 'Lemon'],
  ];

  /**
   * smartImageMapping(filename)
   * ─────────────────────────────
   * Stage 1: Scan filename for known food keywords → return the matching
   *          curated ingredient set for instant, accurate demo results.
   * Stage 2: If no keyword match, pick a random FALLBACK_SET — always a
   *          complete, coherent group of 4–5 complementary ingredients.
   *
   * Replaces the raw random pool selector to ensure every demo upload
   * produces a realistic, multi-ingredient response that drives great recipes.
   *
   * @param {string} filename - The uploaded file's name
   * @returns {string[]} Curated array of 4–5 detected ingredient names
   */
  function smartImageMapping(filename) {
    const lower = filename.toLowerCase().replace(/[-_.\s]/g, ' ');

    // Stage 1: filename keyword → curated set
    for (const [keyword, ingredients] of Object.entries(SMART_INGREDIENT_SETS)) {
      if (lower.includes(keyword)) return ingredients;
    }

    // Stage 2: random fallback — always a coherent 4–5 ingredient group
    const idx = Math.floor(Math.random() * FALLBACK_SETS.length);
    return FALLBACK_SETS[idx];
  }

  /* ══════════════════════════════════════
     NAVBAR
  ══════════════════════════════════════ */
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  navBurger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  document.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  /* ══════════════════════════════════════
     IMAGE GALLERY HELPERS
  ══════════════════════════════════════ */
  function addToGallery(file, objectUrl) {
    uploadedFiles.push({ file, objectUrl });

    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.url = objectUrl;

    const img = document.createElement('img');
    img.src = objectUrl;
    img.className = 'gallery-thumb';
    img.alt = file.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'gallery-remove';
    removeBtn.textContent = '×';
    removeBtn.title = 'Remove';
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      removeFromGallery(objectUrl, item);
    });

    item.appendChild(img);
    item.appendChild(removeBtn);
    imgGallery.appendChild(item);
    imgGallery.classList.remove('hidden');
    uploadPlaceholder.classList.add('hidden');
  }

  function removeFromGallery(objectUrl, itemEl) {
    URL.revokeObjectURL(objectUrl);
    uploadedFiles = uploadedFiles.filter(f => f.objectUrl !== objectUrl);
    itemEl.remove();

    if (uploadedFiles.length === 0) {
      imgGallery.classList.add('hidden');
      uploadPlaceholder.classList.remove('hidden');
    }

    // Remove tags that came from this image's analysis
    rerenderTagsFromState();
  }

  /* ══════════════════════════════════════
     TAG CHIP HELPERS
  ══════════════════════════════════════ */
  function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  function addTag(name) {
    const clean = name.trim();
    if (!clean || detectedTags.includes(clean)) return;
    detectedTags.push(clean);
    renderTag(clean);
    tagsSection.classList.remove('hidden');
  }

  function renderTag(name) {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.dataset.name = name;

    const label = document.createTextNode(name);
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.title = 'Remove';
    btn.addEventListener('click', () => {
      detectedTags = detectedTags.filter(t => t !== name);
      chip.remove();
      if (detectedTags.length === 0) tagsSection.classList.add('hidden');
    });

    chip.appendChild(label);
    chip.appendChild(btn);
    tagsContainer.appendChild(chip);
  }

  function clearTags() {
    detectedTags = [];
    tagsContainer.innerHTML = '';
    tagsSection.classList.add('hidden');
  }

  function rerenderTagsFromState() {
    tagsContainer.innerHTML = '';
    const current = [...detectedTags];
    detectedTags = [];
    current.forEach(t => addTag(t));
  }

  // Add More button
  addTagBtn.addEventListener('click', () => {
    addTagInputWrap.classList.toggle('hidden');
    if (!addTagInputWrap.classList.contains('hidden')) addTagInput.focus();
  });

  addTagInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTagInput.value.split(',').forEach(t => addTag(capitalize(t)));
      addTagInput.value = '';
      addTagInputWrap.classList.add('hidden');
    }
    if (e.key === 'Escape') {
      addTagInputWrap.classList.add('hidden');
    }
  });

  /* ── Inline chip helpers ── */
  function renderInlineChip(name) {
    const chip = document.createElement('span');
    chip.className = 'inline-chip';

    const label = document.createTextNode(name);
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.title = `Remove ${name}`;
    btn.addEventListener('click', () => {
      // Remove from detectedTags and re-sync textarea
      detectedTags = detectedTags.filter(t => t !== name);
      chip.remove();
      ingredientsInput.value = detectedTags.join(', ');
      if (inlineChips.children.length === 0) inlineChips.classList.add('hidden');
    });

    chip.appendChild(label);
    chip.appendChild(btn);
    inlineChips.appendChild(chip);
    inlineChips.classList.remove('hidden');
  }

  function clearInlineChips() {
    inlineChips.innerHTML = '';
    inlineChips.classList.add('hidden');
    detectionWarning.classList.add('hidden');
  }

  async function processFiles(files) {
    const validFiles = Array.from(files).filter(f =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 5 * 1024 * 1024
    );

    if (validFiles.length === 0) return;

    // Add images to the gallery immediately
    for (const file of validFiles) {
      const url = URL.createObjectURL(file);
      addToGallery(file, url);
    }

    // Instantly show "Analyzing with IBM Granite Vision..." loading state
    generateBtn.disabled = true;
    generateBtn.textContent = 'Analyzing with IBM Granite Vision...';
    clearInlineChips();

    cvBadge.classList.remove('hidden');
    cvStatus.textContent = 'Analyzing with IBM Granite Vision…';

    // Simulate 1.5-second backend multimodal API latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    cvBadge.classList.add('hidden');

    // Run Smart Image Mapping for every uploaded file, merging results
    // Each filename is checked for keywords → curated set; else random fallback
    for (const file of validFiles) {
      const ingredients = smartImageMapping(file.name);
      ingredients.forEach(t => addTag(t));
    }

    // Populate the main textarea with all detected ingredient names
    ingredientsInput.value = detectedTags.join(', ');

    // Immediately render editable inline chips below the textarea
    clearInlineChips();
    detectedTags.forEach(t => renderInlineChip(t));
    detectionWarning.classList.add('hidden');

    // Re-enable generate button — user can now click "Generate Recipe"
    generateBtn.disabled = false;
    generateBtn.textContent = '🍃 Generate Recipe';
  }

  /* ══════════════════════════════════════
     UPLOAD EVENT BINDING
  ══════════════════════════════════════ */
  uploadBrowse.addEventListener('click', e => {
    e.stopPropagation();
    imageInput.click();
  });

  uploadZone.addEventListener('click', () => {
    imageInput.click();
  });

  imageInput.addEventListener('change', () => {
    if (imageInput.files && imageInput.files.length > 0) {
      processFiles(imageInput.files);
      imageInput.value = ''; // reset so same files can be re-added
    }
  });

  uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    processFiles(e.dataTransfer.files);
  });

  /* ══════════════════════════════════════
     CULINARY CATEGORIZATION ENGINE
  ══════════════════════════════════════ */

  // Category detection helpers
  function hasAny(list, keywords) {
    return keywords.some(k => list.some(i => i.toLowerCase().includes(k)));
  }

  const ROOT_VEG_KEYS = ['potato','carrot','beetroot','mushroom'];
  const CURRY_KEYS    = ['tomato','onion','garlic','paneer','potato','ginger','chickpea','lentil','spinach','pumpkin'];
  const DESSERT_KEYS  = ['apple','banana','mango','fig','cherry','raspberry','blueberry','strawberry','pineapple','almond','walnut','peanut','cashew','coconut','bread','oat'];
  const SALAD_KEYS    = ['lettuce','spinach','cucumber','avocado','tomato','beetroot','cabbage','celery','radish','corn','feta','cheese'];
  const SOUP_KEYS     = ['carrot','celery','lentil','chickpea','broccoli','cauliflower','cabbage','zucchini','leek','pumpkin'];
  const PROTEIN_KEYS  = ['chicken','egg','fish','shrimp','crab','pork','tofu','paneer','cheese','lentil','chickpea','almond','walnut','peanut'];

  function detectCategory(ingredients) {
    if (hasAny(ingredients, DESSERT_KEYS) && !hasAny(ingredients, CURRY_KEYS.filter(k => !['tomato','spinach'].includes(k)))) {
      if (hasAny(ingredients, ['apple','banana','mango','fig','cherry','raspberry','blueberry','strawberry','pineapple'])) return 'dessert';
    }
    // Root vegetable medley: 2+ root veg present → dedicated category
    const rootCount = ROOT_VEG_KEYS.filter(k => hasAny(ingredients, [k])).length;
    if (rootCount >= 2) return 'rootveg';
    if (hasAny(ingredients, CURRY_KEYS)) return 'curry';
    if (hasAny(ingredients, SALAD_KEYS)) return 'salad';
    if (hasAny(ingredients, SOUP_KEYS)) return 'soup';
    return 'saute';
  }

  /* ── ROOT VEGETABLE MEDLEY RECIPE ── */
  function buildRootVegRecipe(ingredients) {
    const list = ingredients.slice(0, 5).join(', ');
    return {
      dishName: 'Homestyle Root Vegetable & Tomato Medley',
      steps: [
        '<strong>Prep:</strong> Peel and cube all root vegetables (potato, carrot, beetroot) into even 2 cm pieces. Slice mushrooms and halve any cherry tomatoes.',
        `<strong>Roast:</strong> Toss ${list} in 3 tbsp olive oil, 1 tsp cumin, ½ tsp turmeric, salt, and pepper. Spread on a baking tray and roast at 200 °C for 25 min, turning halfway.`,
        '<strong>Sauce:</strong> While roasting, sauté 1 chopped onion and 2 garlic cloves in butter until golden. Add 2 tbsp tomato purée and a pinch of smoked paprika; cook 3 min.',
        '<strong>Combine:</strong> Add the roasted vegetables to the sauce; toss together over low heat for 2–3 min so every piece is coated.',
        '<strong>Finish:</strong> Adjust seasoning, squeeze over fresh lemon juice, and garnish with chopped parsley or coriander.',
        '<strong>Serve:</strong> Serve warm as a main with crusty bread, or as a hearty side alongside grilled protein.',
      ],
    };
  }

  /* ── CURRY RECIPE ── */
  function buildCurryRecipe(ingredients) {
    const hasPaneer   = hasAny(ingredients, ['paneer']);
    const hasPotato   = hasAny(ingredients, ['potato']);
    const hasSpinach  = hasAny(ingredients, ['spinach']);
    const hasChicken  = hasAny(ingredients, ['chicken']);
    const hasLentil   = hasAny(ingredients, ['lentil','chickpea']);

    // Build a dynamic title from the actual primary ingredients in the list
    function curryTitle(a, b) {
      return `Homestyle ${capitalize(a)} & ${capitalize(b)} Curry`;
    }

    let dishName, steps;

    if (hasPaneer && hasPotato) {
      dishName = 'Shahi Paneer Aloo Dum';
      steps = [
        '<strong>Temper:</strong> Heat 2 tbsp ghee in a deep pan. Add 1 tsp cumin seeds, 2 cardamom pods, and 1 bay leaf until fragrant (30 sec).',
        '<strong>Base:</strong> Add finely chopped onion; cook on medium heat for 8 min until golden. Stir in 1 tsp ginger-garlic paste for 1 min.',
        '<strong>Masala:</strong> Add 1 tsp coriander powder, ½ tsp turmeric, 1 tsp Kashmiri chilli powder, and 2 tbsp tomato purée. Cook until oil separates (5 min).',
        '<strong>Cream:</strong> Lower heat, stir in 3 tbsp cashew paste or cream. Simmer 2 min.',
        `<strong>Aloo:</strong> Add cubed ${hasPotato ? 'potatoes' : 'vegetables'}; coat well and cook covered for 10 min until almost tender.`,
        '<strong>Paneer:</strong> Add cubed paneer. Gently fold in, cover and simmer 5 min.',
        '<strong>Finish:</strong> Adjust salt, add ½ tsp garam masala and a pinch of dried fenugreek. Garnish with fresh coriander and serve with naan or basmati rice.',
      ];
    } else if (hasChicken && hasSpinach) {
      dishName = curryTitle('Spinach', 'Chicken');
      steps = [
        '<strong>Marinate:</strong> Mix chicken pieces with 2 tbsp yoghurt, ½ tsp turmeric, and 1 tsp chilli powder. Rest 15 min.',
        '<strong>Sear:</strong> Heat 2 tbsp oil; sear chicken until golden. Remove and set aside.',
        '<strong>Base:</strong> In the same pan cook onion, garlic, and ginger until deep golden. Add 1 tsp cumin, 1 tsp coriander, and chopped tomato; cook until oil separates.',
        '<strong>Spinach:</strong> Add fresh spinach; stir until wilted (2 min), then blend the base to a smooth sauce.',
        '<strong>Combine:</strong> Return chicken to the pan; simmer in spinach-curry sauce for 12 min until cooked through.',
        '<strong>Finish:</strong> Add ½ tsp garam masala, a squeeze of lemon. Serve with steamed basmati rice or naan.',
      ];
    } else if (hasSpinach && hasPaneer) {
      dishName = 'Palak Paneer with Smoky Tadka';
      steps = [
        '<strong>Blanch:</strong> Blanch spinach in boiling salted water for 2 min; plunge into ice water, then blend to a smooth purée.',
        '<strong>Tadka:</strong> Heat 2 tbsp ghee, add cumin seeds, dried chilli, and minced garlic; sizzle for 30 sec.',
        '<strong>Build:</strong> Add chopped onion, cook until golden; add 1 tsp each of coriander and cumin powder, ½ tsp turmeric.',
        '<strong>Combine:</strong> Pour in spinach purée; simmer 5 min. Add 2 tbsp cream or yoghurt.',
        '<strong>Paneer:</strong> Fold in lightly pan-fried paneer cubes; simmer 3 min. Season and serve.',
      ];
    } else if (hasLentil) {
      dishName = 'Homestyle Dal Tadka with Cumin Butter';
      steps = [
        '<strong>Pressure cook:</strong> Rinse lentils/chickpeas; cook with water, ½ tsp turmeric, and salt until very soft.',
        '<strong>Tadka:</strong> Heat 2 tbsp butter/ghee; crackle cumin seeds, then add chopped onion, tomato, ginger, and garlic. Cook until thick and jammy (8 min).',
        '<strong>Combine:</strong> Pour tadka into dal; add 1 tsp coriander powder and ½ tsp garam masala. Simmer 5 min.',
        '<strong>Finish:</strong> Top with a final spoon of ghee, dried chilli, and fresh coriander. Serve with steamed rice.',
      ];
    } else {
      // Use the first two distinct user ingredients as the dish name — never hardcode "Tomato"
      const primaryA = ingredients[0] || 'Vegetable';
      const primaryB = ingredients[1] || 'Herb';
      const list = ingredients.slice(0, 4).join(', ');
      dishName = curryTitle(primaryA, primaryB);
      steps = [
        '<strong>Temper:</strong> Heat 2 tbsp oil; add mustard seeds, curry leaves, and dried chilli until they pop.',
        `<strong>Base:</strong> Add chopped onions and ${primaryB}; sauté until golden-brown.`,
        '<strong>Masala:</strong> Stir in 1 tsp cumin, 1 tsp coriander, ½ tsp turmeric, ½ tsp chilli powder. Cook 2 min.',
        `<strong>Main:</strong> Add chopped ${list}; mix well. Add ½ cup water and 2 tbsp tomato purée.`,
        '<strong>Simmer:</strong> Cover and cook 15 min until vegetables are tender and gravy thickens.',
        '<strong>Finish:</strong> Sprinkle garam masala, garnish with coriander. Serve with rice or roti.',
      ];
    }

    return { dishName, steps };
  }

  /* ── DESSERT RECIPE ── */
  function buildDessertRecipe(ingredients) {
    const hasApple  = hasAny(ingredients, ['apple']);
    const hasBanana = hasAny(ingredients, ['banana']);
    const hasNuts   = hasAny(ingredients, ['almond','walnut','peanut','cashew']);
    const hasBread  = hasAny(ingredients, ['bread']);

    let dishName, steps;

    if (hasApple && hasNuts) {
      dishName = 'Spiced Apple & Roasted Peanut Crumble';
      steps = [
        '<strong>Filling:</strong> Peel and dice 3 apples; toss with 2 tbsp brown sugar, ½ tsp cinnamon, and a squeeze of lemon.',
        '<strong>Crumble:</strong> Combine 60g oats, 40g flour, 40g chopped peanuts/nuts, 2 tbsp brown sugar, and 3 tbsp melted butter. Mix until crumbly.',
        '<strong>Assemble:</strong> Spread apple filling in a baking dish; top evenly with crumble mixture.',
        '<strong>Bake:</strong> Bake at 180°C for 30–35 min until topping is golden and filling is bubbling.',
        '<strong>Serve:</strong> Rest 5 min, then serve warm with vanilla yoghurt or ice cream.',
      ];
    } else if (hasApple && hasBread) {
      dishName = 'Golden Caramelised Apple French Toast';
      steps = [
        '<strong>Custard:</strong> Whisk 2 eggs, 3 tbsp milk, ½ tsp cinnamon, and 1 tbsp sugar.',
        '<strong>Soak:</strong> Dip thick bread slices in the custard for 30 sec each side.',
        '<strong>Cook:</strong> Melt 1 tbsp butter in a pan over medium heat; cook bread 3 min per side until golden.',
        '<strong>Apple caramel:</strong> In the same pan, cook thin apple slices with 1 tbsp butter and 2 tbsp brown sugar for 4 min until caramelised.',
        '<strong>Serve:</strong> Top French toast with caramelised apples and a dusting of icing sugar.',
      ];
    } else if (hasBanana) {
      const extra = hasNuts ? ingredients.filter(i => hasAny([i], ['almond','walnut','peanut','cashew']))[0] : 'oats';
      dishName = `Honey Banana & ${extra ? capitalize(extra) : 'Oat'} Breakfast Bowl`;
      steps = [
        '<strong>Base:</strong> Slice bananas; arrange in a bowl over a bed of yoghurt or warm oats.',
        `<strong>Topping:</strong> Scatter ${extra || 'granola'}, drizzle 1 tbsp honey, and add a pinch of cinnamon.`,
        '<strong>Optional warm version:</strong> Pan-fry banana slices with butter and brown sugar for 2 min until golden before plating.',
      ];
    } else {
      const fruit = ingredients[0];
      dishName = `${capitalize(fruit)} Compote with Spiced Yoghurt`;
      steps = [
        `<strong>Compote:</strong> Simmer sliced ${fruit} with 2 tbsp sugar, a splash of water, and ½ tsp vanilla for 8 min.`,
        '<strong>Yoghurt:</strong> Stir a pinch of cardamom and 1 tsp honey into thick Greek yoghurt.',
        '<strong>Serve:</strong> Spoon warm compote over chilled yoghurt. Top with crushed nuts or granola.',
      ];
    }

    return { dishName, steps };
  }

  /* ── SALAD RECIPE ── */
  function buildSaladRecipe(ingredients) {
    const hasAvocado = hasAny(ingredients, ['avocado']);
    const hasCheese  = hasAny(ingredients, ['feta','cheese']);
    const list       = ingredients.slice(0, 5).join(', ');

    const dishName = hasAvocado
      ? 'Avocado & Garden Fresh Salad with Lemon-Herb Dressing'
      : `${ingredients[0]} & Mixed Greens Salad`;

    const steps = [
      `<strong>Prep:</strong> Wash and chop ${list} into bite-sized pieces or thin slices.`,
      '<strong>Dressing:</strong> Whisk 2 tbsp olive oil, 1 tbsp lemon juice, 1 tsp Dijon mustard, salt, and pepper.',
      hasAvocado
        ? '<strong>Avocado:</strong> Halve, pit, and slice or cube avocado just before serving to prevent browning.'
        : '<strong>Toss:</strong> Combine all vegetables in a large bowl.',
      hasCheese ? '<strong>Finish:</strong> Crumble feta or shave cheese over the top.' : '<strong>Finish:</strong> Add a handful of seeds or nuts for crunch.',
      '<strong>Dress:</strong> Drizzle dressing, toss gently, and serve immediately.',
    ];

    return { dishName, steps };
  }

  /* ── SOUP RECIPE ── */
  function buildSoupRecipe(ingredients) {
    const hasPumpkin    = hasAny(ingredients, ['pumpkin','squash']);
    const hasBroccoli   = hasAny(ingredients, ['broccoli','cauliflower']);
    const list          = ingredients.slice(0, 5).join(', ');

    let dishName, steps;

    if (hasPumpkin) {
      dishName = 'Roasted Pumpkin & Ginger Bisque';
      steps = [
        '<strong>Roast:</strong> Cube pumpkin, toss with olive oil, salt, and cumin. Roast at 200°C for 25 min until caramelised.',
        '<strong>Sauté:</strong> Cook onion, garlic, and fresh ginger in a pot until soft.',
        '<strong>Blend:</strong> Add roasted pumpkin and 600ml vegetable stock; simmer 10 min. Blend until silky smooth.',
        '<strong>Season:</strong> Stir in 2 tbsp coconut milk, salt, pepper, and a pinch of nutmeg.',
        '<strong>Serve:</strong> Ladle into bowls, swirl extra coconut milk, and garnish with pepitas.',
      ];
    } else if (hasBroccoli) {
      dishName = 'Creamy Broccoli & Cauliflower Chowder';
      steps = [
        '<strong>Sauté:</strong> Cook onion, celery, and garlic in butter until soft.',
        '<strong>Stock:</strong> Add chopped broccoli/cauliflower and 700ml vegetable stock. Simmer 12 min.',
        '<strong>Cream:</strong> Stir in 100ml cream or milk; blend half the soup for a creamy-chunky texture.',
        '<strong>Season:</strong> Add cheddar cheese (optional), salt, pepper, and a pinch of cayenne.',
        '<strong>Serve:</strong> Top with croutons, chives, or a drizzle of olive oil.',
      ];
    } else {
      dishName = `Hearty ${ingredients[0]} & Vegetable Broth`;
      steps = [
        `<strong>Base:</strong> Sauté diced onion, garlic, and celery in olive oil until soft.`,
        `<strong>Vegetables:</strong> Add chopped ${list} and stir for 2 min.`,
        '<strong>Stock:</strong> Pour in 800ml vegetable or chicken stock. Bring to boil; reduce and simmer 20 min.',
        '<strong>Season:</strong> Adjust salt and pepper; add fresh herbs (thyme, parsley).',
        '<strong>Serve:</strong> Ladle into bowls with crusty bread.',
      ];
    }

    return { dishName, steps };
  }

  /* ── SAUTÉ FALLBACK ── */
  function buildSauteRecipe(ingredients) {
    const list     = ingredients.join(', ');
    const dishName = ingredients.length === 1
      ? `${ingredients[0]} Sauté with Herb Butter`
      : ingredients.length === 2
        ? `${ingredients[0]} & ${ingredients[1]} Toss`
        : `${ingredients[0]}, ${ingredients[1]} & Seasonal Vegetable Sauté`;

    const steps = [
      `<strong>Prep:</strong> Wash and slice all ingredients — ${list} — uniformly for even cooking.`,
      '<strong>Heat:</strong> Warm 2 tbsp olive oil in a wide pan over medium-high heat.',
      ...ingredients.map((ing, i) =>
        i === 0
          ? `<strong>Step 1:</strong> Add ${ing}; cook 3–4 min until lightly golden.`
          : `<strong>Step ${i + 1}:</strong> Add ${ing}; stir-fry 2–3 min.`
      ),
      '<strong>Deglaze:</strong> Add a splash of vegetable stock or water; scrape up any caramelised bits.',
      '<strong>Season:</strong> Finish with salt, pepper, fresh lemon zest, and herbs of choice.',
      '<strong>Serve:</strong> Plate over steamed rice, couscous, or with flatbread.',
    ];

    return { dishName, steps };
  }

  /* ── RECIPE DISPATCHER ── */
  function buildRecipe(ingredients) {
    if (ingredients.length === 0) {
      return { dishName: 'Mystery Chef Special', steps: ['Please enter or detect at least one ingredient.'] };
    }
    const category = detectCategory(ingredients);
    switch (category) {
      case 'rootveg': return buildRootVegRecipe(ingredients);
      case 'curry':   return buildCurryRecipe(ingredients);
      case 'dessert': return buildDessertRecipe(ingredients);
      case 'salad':   return buildSaladRecipe(ingredients);
      case 'soup':    return buildSoupRecipe(ingredients);
      default:        return buildSauteRecipe(ingredients);
    }
  }

  /* ══════════════════════════════════════
     DYNAMIC NUTRITION ESTIMATION
  ══════════════════════════════════════ */
  const NUTRITION_DB = {
    // [calories, protein_g, fat_g] per ~100g serving
    'Paneer':       [265, 18, 20], 'Chicken':    [165, 31,  4],
    'Egg':          [155, 13, 11], 'Fish':        [120, 20,  4],
    'Shrimp':       [ 90, 18,  1], 'Tofu':        [ 70,  8,  4],
    'Lentils':      [116,  9,  0], 'Chickpeas':   [164,  9,  3],
    'Almonds':      [579, 21, 50], 'Walnuts':     [654, 15, 65],
    'Peanut':       [567, 26, 49], 'Cashews':     [553, 18, 44],
    'Potato':       [ 77,  2,  0], 'Sweet Potato':[ 86,  2,  0],
    'Rice':         [130,  3,  0], 'Pasta':       [131,  5,  1],
    'Bread':        [265,  9,  3], 'Corn':        [ 86,  3,  1],
    'Avocado':      [160,  2, 15], 'Coconut':     [354,  3, 33],
    'Tomato':       [ 18,  1,  0], 'Onion':        [ 40,  1,  0],
    'Garlic':       [149,  6,  0], 'Spinach':      [ 23,  3,  0],
    'Broccoli':     [ 34,  3,  0], 'Carrot':       [ 41,  1,  0],
    'Apple':        [ 52,  0,  0], 'Banana':       [ 89,  1,  0],
    'Mango':        [ 60,  1,  0], 'Cheese':      [402, 25, 33],
    'Mushroom':     [ 22,  3,  0], 'Zucchini':    [ 17,  1,  0],
    'Pumpkin':      [ 26,  1,  0], 'Bell Pepper': [ 31,  1,  0],
    'Cucumber':     [ 16,  1,  0], 'Cabbage':      [ 25,  1,  0],
    'Lettuce':      [ 15,  1,  0], 'Ginger':       [ 80,  2,  1],
    'Lemon':        [ 29,  1,  0], 'Beetroot':     [ 43,  2,  0],
  };

  function estimateNutrition(ingredients) {
    let cal = 80, prot = 4, fat = 4; // base for oil/spices
    for (const ing of ingredients) {
      const key = Object.keys(NUTRITION_DB).find(k => ing.toLowerCase().includes(k.toLowerCase()));
      if (key) {
        const [c, p, f] = NUTRITION_DB[key];
        cal  += Math.round(c * 0.15);   // ~150g per person
        prot += Math.round(p * 0.15);
        fat  += Math.round(f * 0.15);
      } else {
        cal += 35; prot += 1; fat += 1;
      }
    }
    return { calories: cal, protein: prot, fats: fat };
  }

  /* ══════════════════════════════════════
     TAILORED ZERO-WASTE TIPS
  ══════════════════════════════════════ */
  // Zero-waste tip dictionary: keyword → [storage sentence, zero-waste sentence]
  const STORAGE_DICT = {
    tomato:   ['Store tomatoes at room temperature away from direct sunlight — never in the fridge.',
               'Zero-Waste: Dehydrate skins in the oven at 100 °C for 1–2 hrs, then blend into <em>tomato powder</em> for seasoning.'],
    apple:    ['Keep apples in the crisper drawer of the fridge — they last up to 6 weeks when chilled.',
               'Zero-Waste: Boil peels and cores with water and cinnamon sticks, then ferment to make <em>apple cider vinegar</em>.'],
    potato:   ['Store potatoes in a cool, dark pantry in a paper bag — away from onions and out of the fridge.',
               'Zero-Waste: Toss peels in olive oil, salt, and smoked paprika, then bake at 200 °C for 15 min for <em>crispy potato chips</em>.'],
    paneer:   ['Keep paneer submerged in water in an airtight container in the fridge; change water daily. Use within 3–4 days.',
               'Zero-Waste: The protein-rich whey left from making paneer is perfect as a liquid in bread dough, dal, or smoothies.'],
    lemon:    ['Store whole lemons at room temp for 1 week, or refrigerate in a zip-lock bag for up to 4 weeks.',
               'Zero-Waste: Freeze spent lemon halves and grate directly into dishes frozen. Boil rinds with sugar to make <em>candied peel</em>.'],
    spinach:  ['Store spinach dry in a paper-towel-lined airtight container in the fridge for up to 5 days.',
               'Zero-Waste: Wilted or yellowing leaves are perfect blended into soups, sauces, or green smoothies — no waste.'],
    lettuce:  ['Keep lettuce whole and unwashed in the crisper drawer; wash only just before serving.',
               'Zero-Waste: Outer leaves and stalks can be simmered into a light vegetable broth.'],
    cabbage:  ['Wrap cut cabbage tightly in cling film and refrigerate for up to 1 week.',
               'Zero-Waste: Pickle outer leaves and tough ribs with vinegar, salt, and sugar for a tangy quick pickle.'],
    carrot:   ['Remove carrot tops and store roots in water in the fridge to keep them crisp for 2 weeks.',
               'Zero-Waste: Carrot tops are edible — use like parsley or blend into pesto. Roast peels with oil for vegetable crisps.'],
    beetroot: ['Store beetroot uncooked in a cool, dark place for up to 2 weeks; refrigerate once cooked.',
               'Zero-Waste: Beetroot tops and stems are highly nutritious — sauté like chard or add to salads.'],
    ginger:   ['Store unpeeled ginger in the freezer — grate directly from frozen with no peeling needed.',
               'Zero-Waste: Simmer ginger peels with water, honey, and lemon slices for a soothing anti-inflammatory tea.'],
    mushroom: ['Store mushrooms in a paper bag in the fridge — never plastic, as moisture causes sliminess.',
               'Zero-Waste: Mushroom stems add deep umami to stocks and pasta sauces. Dehydrate leftover slices at 80 °C for <em>mushroom powder</em>.'],
  };

  function buildStorageTips(ingredients) {
    const joined = ingredients.join(' ').toLowerCase();

    // Find the first matching key in the dictionary
    const matchedKey = Object.keys(STORAGE_DICT).find(k => joined.includes(k));

    const [storageLine, wasteLine] = matchedKey
      ? STORAGE_DICT[matchedKey]
      : [
          `Store ${ingredients[0] || 'your ingredients'} in an airtight container in the fridge at 2–4 °C for 3–5 days.`,
          `Zero-Waste: Collect any peels, seeds, or trimmings from ${ingredients[0] || 'your ingredients'} in a freezer bag and simmer into a rich vegetable stock.`,
        ];

    return [
      `<p><strong>Short-term:</strong> ${storageLine}</p>`,
      `<p><strong>Long-term:</strong> Cool completely, then freeze in labelled zip-lock bags for up to 3 months. Dehydrate sliced pieces at 55–60 °C for 6–8 hours for shelf-stable snacks.</p>`,
      `<p><strong>${wasteLine}</strong></p>`,
    ].join('');
  }

  /* ══════════════════════════════════════
     INPUT PARSING
  ══════════════════════════════════════ */
  function parseIngredients(raw) {
    const cleaned = raw.replace(/^detected:\s*/i, '');
    return cleaned
      .split(/[\s,;]+/)
      .map(w => w.trim())
      .filter(w => w.length > 1)
      .map(capitalize);
  }

  /* ══════════════════════════════════════
     GENERATE BUTTON
  ══════════════════════════════════════ */
  generateBtn.addEventListener('click', () => {
    // Prefer chips if available, else textarea
    const ingredients = detectedTags.length > 0
      ? detectedTags.map(capitalize)
      : parseIngredients(ingredientsInput.value.trim());

    // Show results with thinking state
    resultsSection.classList.remove('hidden');
    recipeOutput.textContent  = 'Chef AI is thinking…';
    tipsOutput.textContent    = 'Chef AI is thinking…';
    badgeCalories.textContent = '';
    badgeProtein.textContent  = '';
    badgeFats.textContent     = '';
    generateBtn.disabled = true;

    setTimeout(() => resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    setTimeout(() => {
      const { dishName, steps } = buildRecipe(ingredients);
      const nutrition = estimateNutrition(ingredients);

      recipeOutput.innerHTML =
        `<strong>${dishName}</strong><br><br>` +
        steps.map(s => `<p style="margin-bottom:0.5rem">${s}</p>`).join('');

      badgeCalories.textContent = `🔥 ~${nutrition.calories} kcal`;
      badgeProtein.textContent  = `💪 ~${nutrition.protein}g Protein`;
      badgeFats.textContent     = `🥑 ~${nutrition.fats}g Healthy Fats`;

      tipsOutput.innerHTML = buildStorageTips(ingredients);

      generateBtn.disabled = false;
    }, 500);
  });

});
