const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
const Purchase = require('./models/Purchase');
const PriceChange = require('./models/PriceChange');

const seedDatabase = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Connection string:', process.env.MONGODB_URI);

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('Connected to MongoDB successfully');

        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Product.deleteMany({});
        await Supplier.deleteMany({});
        await Purchase.deleteMany({});
        await PriceChange.deleteMany({});

        console.log('Cleared all collections');

        const userData = {
            username: 'admin',
            email: 'admin@zoo.by',
            password: 'admin123',
            role: 'admin',
            timezone: 'Europe/Minsk'
        };

        const user = new User(userData);
        await user.save();

        const suppliers = await Supplier.create([
            {
                name: 'ЗооМаркет',
                address: {
                    street: 'ул. Якуба Коласа, 25',
                    city: 'Минск',
                    country: 'Беларусь',
                    postalCode: '220013'
                },
                phone: '+375 (17) 123-45-67',
                email: 'info@zoomarket.by',
                productsCount: 15,
                rating: 4.7
            },
            {
                name: 'PetHouse',
                address: {
                    street: 'пр. Независимости, 58',
                    city: 'Минск',
                    country: 'Беларусь',
                    postalCode: '220005'
                },
                phone: '+375 (29) 987-65-43',
                email: 'sales@pethouse.by',
                productsCount: 75,
                rating: 4.5
            },
            {
                name: 'АкваМир',
                address: {
                    street: 'ул. Советская, 12',
                    city: 'Гомель',
                    country: 'Беларусь',
                    postalCode: '246050'
                },
                phone: '+375 (25) 555-44-33',
                email: 'gomel@aquamir.by',
                productsCount: 36,
                rating: 4.3
            },
            {
                name: 'ЗооЛюкс',
                address: {
                    street: 'ул. Ленина, 34',
                    city: 'Витебск',
                    country: 'Беларусь',
                    postalCode: '210015'
                },
                phone: '+375 (33) 111-22-33',
                email: 'vitebsk@zoolux.by',
                productsCount: 48,
                rating: 4.2
            },
            {
                name: 'PetCare',
                address: {
                    street: 'ул. Московская, 65',
                    city: 'Брест',
                    country: 'Беларусь',
                    postalCode: '224000'
                },
                phone: '+375 (44) 444-55-66',
                email: 'brest@petcare.by',
                productsCount: 22,
                rating: 4.8
            },
            {
                name: 'БелЗооСнаб',
                address: {
                    street: 'ул. Козлова, 15',
                    city: 'Могилев',
                    country: 'Беларусь',
                    postalCode: '212030'
                },
                phone: '+375 (29) 777-88-99',
                email: 'mogilev@belzoosnab.by',
                productsCount: 50,
                rating: 4.1
            },
            {
                name: 'ЗооТовары',
                address: {
                    street: 'ул. Ожешко, 22',
                    city: 'Гродно',
                    country: 'Беларусь',
                    postalCode: '230023'
                },
                phone: '+375 (17) 333-44-55',
                email: 'grodno@zootovary.by',
                productsCount: 62,
                rating: 4.4
            }
        ]);

        const products = await Product.create([
            {
                name: 'Корм для кошек "Whiskas"',
                sku: 'CAT-FOOD-001',
                description: 'Сбалансированный корм для взрослых кошек, содержит все необходимые витамины и минералы',
                category: 'Корма',
                animalType: ['Кошка'],
                currentPrice: 45.50,
                unit: 'кг',
                stockQuantity: 150,
                minStockLevel: 20,
                imageUrl: 'https://avatars.mds.yandex.net/i?id=7d2b39bb6d3d4698c39dbdc6057b9bef_l-3850454-images-thumbs&n=13'
            },
            {
                name: 'Ошейник для собак',
                sku: 'DOG-ACC-002',
                description: 'Нейлоновый ошейник с пряжкой, регулируемый размер',
                category: 'Аксессуары',
                animalType: ['Собака'],
                currentPrice: 25.99,
                unit: 'шт',
                stockQuantity: 75,
                minStockLevel: 15,
                imageUrl: 'https://ir.ozone.ru/s3/multimedia-x/6273183153.jpg'
            },
            {
                name: 'Игрушка для кошек "Мячик"',
                sku: 'CAT-TOY-003',
                description: 'Мячик с перьями для активных игр, безопасный материал',
                category: 'Игрушки',
                animalType: ['Кошка'],
                currentPrice: 8.50,
                unit: 'шт',
                stockQuantity: 200,
                minStockLevel: 30,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/1925870/2a000001920b395e5ffd93ab71fd7c3d6887/orig'
            },
            {
                name: 'Аквариум 50 литров',
                sku: 'FISH-TANK-004',
                description: 'Стеклянный аквариум с подсветкой, фильтром и крышкой',
                category: 'Аксессуары',
                animalType: ['Рыбка'],
                currentPrice: 175.00,
                unit: 'шт',
                stockQuantity: 12,
                minStockLevel: 3,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/4334326/img_id7503054822459220711.jpeg/orig'
            },
            {
                name: 'Корм для собак "Pedigree"',
                sku: 'DOG-FOOD-005',
                description: 'Сухой корм для взрослых собак, 15кг',
                category: 'Корма',
                animalType: ['Собака'],
                currentPrice: 68.90,
                unit: 'кг',
                stockQuantity: 180,
                minStockLevel: 25,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/3922047/img_id9009923990064385366.jpeg/orig'
            },
            {
                name: 'Клетка для птиц',
                sku: 'BIRD-CAGE-006',
                description: 'Большая клетка с жердочками, поилкой и кормушкой',
                category: 'Аксессуары',
                animalType: ['Птица'],
                currentPrice: 140.50,
                unit: 'шт',
                stockQuantity: 8,
                minStockLevel: 2,
                imageUrl: 'https://main-cdn.sbermegamarket.ru/big1/hlr-system/155/550/201/698/927/100074667393b0.png'
            },
            {
                name: 'Ветеринарный шампунь для животных',
                sku: 'PET-SHAM-007',
                description: 'Шампунь для чувствительной кожи, гипоаллергенный',
                category: 'Гигиена',
                animalType: ['Собака', 'Кошка'],
                currentPrice: 18.75,
                unit: 'л',
                stockQuantity: 45,
                minStockLevel: 10,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/12022975/2a0000019012568b697bda83698b8fcbee71/orig'
            },
            {
                name: 'Переноска для кошек',
                sku: 'CAT-CARR-008',
                description: 'Пластиковая переноска с дверцей, вентиляционными отверстиями',
                category: 'Переноски',
                animalType: ['Кошка'],
                currentPrice: 75.00,
                unit: 'шт',
                stockQuantity: 20,
                minStockLevel: 5,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/12579532/2a0000018d5714e868228db3fc3743212b8b/orig'
            },
            {
                name: 'Корм для рыбок "Tetra"',
                sku: 'FISH-FOOD-009',
                description: 'Хлопья для тропических рыб, 100г',
                category: 'Корма',
                animalType: ['Рыбка'],
                currentPrice: 12.50,
                unit: 'г',
                stockQuantity: 120,
                minStockLevel: 20,
                imageUrl: 'https://avatars.mds.yandex.net/i?id=5361b0d7ff266688367717897fde662c_l-4613464-images-thumbs&n=13'
            },
            {
                name: 'Домик для грызунов',
                sku: 'RODENT-HOME-010',
                description: 'Деревянный домик для хомяков и морских свинок',
                category: 'Аксессуары',
                animalType: ['Грызун'],
                currentPrice: 30.00,
                unit: 'шт',
                stockQuantity: 35,
                minStockLevel: 8,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/11450294/2a0000018b4cb6d58cf638b015bec38d8c62/orig'
            },
            {
                name: 'Поводок для собак',
                sku: 'DOG-LEASH-011',
                description: 'Нейлоновый поводок 2м с карабином',
                category: 'Аксессуары',
                animalType: ['Собака'],
                currentPrice: 16.40,
                unit: 'шт',
                stockQuantity: 60,
                minStockLevel: 12,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/15249557/2a000001967d477ea0d3bc04d60333751de6/orig'
            },
            {
                name: 'Когтеточка для кошек',
                sku: 'CAT-SCRATCH-012',
                description: 'Картонная когтеточка с кошачьей мятой',
                category: 'Аксессуары',
                animalType: ['Кошка'],
                currentPrice: 14.90,
                unit: 'шт',
                stockQuantity: 90,
                minStockLevel: 15,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/16505546/2a0000019741bb98a7a19deadfe93c6faffa/orig'
            },
            {
                name: 'Миска для животных керамическая',
                sku: 'PET-BOWL-013',
                description: 'Керамическая миска 0.5л, нескользящее дно',
                category: 'Аксессуары',
                animalType: ['Собака', 'Кошка'],
                currentPrice: 9.90,
                unit: 'шт',
                stockQuantity: 150,
                minStockLevel: 25,
                imageUrl: 'https://main-cdn.sbermegamarket.ru/big1/hlr-system/-49/834/140/151/620/16/100051626811b0.jpg'
            },
            {
                name: 'Наполнитель для кошачьего туалета',
                sku: 'CAT-LITTER-014',
                description: 'Древесный наполнитель, 10л',
                category: 'Гигиена',
                animalType: ['Кошка'],
                currentPrice: 22.50,
                unit: 'л',
                stockQuantity: 80,
                minStockLevel: 15,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/3707358/2a000001905bbc1f2c52628e5c7e0deba73b/orig'
            },
            {
                name: 'Игрушка для собак "Кость"',
                sku: 'DOG-TOY-015',
                description: 'Прочная резиновая кость для собак',
                category: 'Игрушки',
                animalType: ['Собака'],
                currentPrice: 11.25,
                unit: 'шт',
                stockQuantity: 110,
                minStockLevel: 20,
                imageUrl: 'https://cdn1.ozone.ru/s3/multimedia-k/6190581428.jpg'
            }
        ]);

        const purchases = [];
        const purchaseCount = 25;

        for (let i = 0; i < purchaseCount; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
            const purchaseDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
            const deliveryDate = new Date(purchaseDate.getTime() + (2 + Math.random() * 5) * 24 * 60 * 60 * 1000);

            const purchasePrice = product.currentPrice * (0.5 + Math.random() * 0.3);
            const quantity = Math.floor(Math.random() * 100) + 10;

            purchases.push({
                product: product._id,
                supplier: supplier._id,
                quantity: quantity,
                purchasePrice: parseFloat(purchasePrice.toFixed(2)),
                purchaseDate: purchaseDate,
                deliveryDate: deliveryDate,
                status: Math.random() > 0.2 ? 'delivered' : 'ordered',
                invoiceNumber: `BY-INV-${20240000 + i}`,
                notes: `Закупка ${product.name} у ${supplier.name}`,
                createdBy: user._id
            });
        }

        const createdPurchases = await Purchase.create(purchases);

        const priceChanges = [];

        for (const product of products) {
            const priceChangeCount = Math.floor(Math.random() * 3) + 1;

            for (let j = 0; j < priceChangeCount; j++) {
                const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
                const changeDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
                const effectiveDate = new Date(changeDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);

                const oldPrice = product.currentPrice * (0.7 + Math.random() * 0.4);

                const reasons = [
                    'Изменение курса валют',
                    'Изменение цены поставщиком',
                    'Сезонное изменение',
                    'Изменение транспортных расходов',
                    'Акция поставщика',
                    'Изменение таможенных пошлин'
                ];

                priceChanges.push({
                    product: product._id,
                    supplier: supplier._id,
                    oldPrice: parseFloat(oldPrice.toFixed(2)),
                    newPrice: product.currentPrice,
                    changeDate: changeDate,
                    effectiveDate: effectiveDate,
                    reason: reasons[Math.floor(Math.random() * reasons.length)],
                    notified: Math.random() > 0.5,
                    createdBy: user._id
                });
            }
        }

        const createdPriceChanges = await PriceChange.create(priceChanges);

        console.log('Database seeded successfully!');
        console.log('Start the server: npm run dev');
        console.log('API will be available at: http://localhost:5000');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);

        if (error.code) {
            console.error('Error code:', error.code);
        }

        if (error.reason) {
            console.error('Error reason:', error.reason);
        }

        process.exit(1);
    }
};

seedDatabase();