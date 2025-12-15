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

        console.log('✅ Connected to MongoDB successfully');

        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Product.deleteMany({});
        await Supplier.deleteMany({});
        await Purchase.deleteMany({});
        await PriceChange.deleteMany({});

        console.log('✅ Cleared all collections');

        const userData = {
            username: 'admin',
            email: 'admin@zoo.by',
            password: 'admin123',
            role: 'admin',
            timezone: 'Europe/Minsk'
        };

        const user = new User(userData);
        await user.save();
        console.log('✅ Test user created:', user.username);

        const suppliers = await Supplier.create([
            {
                name: 'ЗооМаркет Бел',
                address: {
                    street: 'ул. Якуба Коласа, 25',
                    city: 'Минск',
                    country: 'Беларусь',
                    postalCode: '220013'
                },
                phone: '+375 (17) 123-45-67',
                email: 'info@zoomarket.by',
                rating: 4.7
            },
            {
                name: 'PetHouse Беларусь',
                address: {
                    street: 'пр. Независимости, 58',
                    city: 'Минск',
                    country: 'Беларусь',
                    postalCode: '220005'
                },
                phone: '+375 (29) 987-65-43',
                email: 'sales@pethouse.by',
                rating: 4.5
            },
            {
                name: 'АкваМир Гомель',
                address: {
                    street: 'ул. Советская, 12',
                    city: 'Гомель',
                    country: 'Беларусь',
                    postalCode: '246050'
                },
                phone: '+375 (25) 555-44-33',
                email: 'gomel@aquamir.by',
                rating: 4.3
            },
            {
                name: 'ЗооЛюкс Витебск',
                address: {
                    street: 'ул. Ленина, 34',
                    city: 'Витебск',
                    country: 'Беларусь',
                    postalCode: '210015'
                },
                phone: '+375 (33) 111-22-33',
                email: 'vitebsk@zoolux.by',
                rating: 4.2
            },
            {
                name: 'PetCare Брест',
                address: {
                    street: 'ул. Московская, 65',
                    city: 'Брест',
                    country: 'Беларусь',
                    postalCode: '224000'
                },
                phone: '+375 (44) 444-55-66',
                email: 'brest@petcare.by',
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
                rating: 4.1
            },
            {
                name: 'ЗооТовары Гродно',
                address: {
                    street: 'ул. Ожешко, 22',
                    city: 'Гродно',
                    country: 'Беларусь',
                    postalCode: '230023'
                },
                phone: '+375 (17) 333-44-55',
                email: 'grodno@zootovary.by',
                rating: 4.4
            }
        ]);

        console.log(`✅ Created ${suppliers.length} suppliers`);

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
                imageUrl: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1554456854-55a089fd4cb2?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1562790351-d273a961e0e9?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1558369982-f076d9872225?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop'
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
                imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=300&fit=crop'
            }
        ]);

        console.log(`✅ Created ${products.length} products`);

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
        console.log(`✅ Created ${createdPurchases.length} purchases`);

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
        console.log(`✅ Created ${createdPriceChanges.length} price changes`);

        console.log('\n=== 📊 Database Summary ===');
        console.log(`👤 Users: 1 (admin:admin123)`);
        console.log(`🏢 Suppliers: ${suppliers.length} (белорусские компании)`);
        console.log(`📦 Products: ${products.length}`);
        console.log(`🛒 Purchases: ${createdPurchases.length}`);
        console.log(`💰 Price Changes: ${createdPriceChanges.length}`);
        console.log('============================\n');

        console.log('🎉 Database seeded successfully!');
        console.log('\n🔑 Test credentials:');
        console.log('Username: admin');
        console.log('Email: admin@zoo.by');
        console.log('Password: admin123');
        console.log('Timezone: Europe/Minsk');
        console.log('\n🚀 Start the server: npm run dev');
        console.log('🌐 API will be available at: http://localhost:5000');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:');
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