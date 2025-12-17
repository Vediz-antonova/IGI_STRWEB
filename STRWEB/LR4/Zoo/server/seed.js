const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
const Purchase = require('./models/Purchase');
const PriceChange = require('./models/PriceChange');

const seedDatabase = async () => {
    try {
        console.log('Подключение к MongoDB...');
        console.log('Строка подключения:', process.env.MONGODB_URI);

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        console.log('Успешное подключение к MongoDB');

        console.log('Очистка существующих данных...');
        await User.deleteMany({});
        await Product.deleteMany({});
        await Supplier.deleteMany({});
        await Purchase.deleteMany({});
        await PriceChange.deleteMany({});

        console.log('Все коллекции очищены');

        const users = await User.create([
            {
                username: 'admin',
                email: 'admin@zoo.by',
                password: 'admin123',
                role: 'admin',
                timezone: 'Europe/Minsk',
                lastLogin: new Date('2024-12-10')
            },
            {
                username: 'manager1',
                email: 'manager1@zoo.by',
                password: 'manager123',
                role: 'user',
                timezone: 'Europe/Minsk',
                lastLogin: new Date('2024-12-09')
            },
            {
                username: 'manager2',
                email: 'manager2@zoo.by',
                password: 'manager123',
                role: 'user',
                timezone: 'Europe/Minsk',
                lastLogin: new Date('2024-12-08')
            },
            {
                username: 'buyer1',
                email: 'buyer1@zoo.by',
                password: 'buyer123',
                role: 'user',
                timezone: 'Europe/Warsaw',
                lastLogin: new Date('2024-12-07')
            },
            {
                username: 'buyer2',
                email: 'buyer2@zoo.by',
                password: 'buyer123',
                role: 'user',
                timezone: 'Europe/Warsaw',
                lastLogin: new Date('2024-12-06')
            },
            {
                username: 'analyst1',
                email: 'analyst1@zoo.by',
                password: 'analyst123',
                role: 'user',
                timezone: 'Europe/Moscow',
                lastLogin: new Date('2024-12-05')
            },
            {
                username: 'analyst2',
                email: 'analyst2@zoo.by',
                password: 'analyst123',
                role: 'user',
                timezone: 'Europe/Moscow',
                lastLogin: new Date('2024-12-04')
            },
            {
                username: 'testuser1',
                email: 'test1@zoo.by',
                password: 'test123',
                role: 'user',
                timezone: 'UTC',
                lastLogin: new Date('2024-11-29')
            },
            {
                username: 'testuser2',
                email: 'test2@zoo.by',
                password: 'test123',
                role: 'user',
                timezone: 'UTC',
                lastLogin: new Date('2024-11-28')
            },
            {
                username: 'testuser3',
                email: 'test3@zoo.by',
                password: 'test123',
                role: 'user',
                timezone: 'UTC',
                lastLogin: new Date('2024-11-27')
            },
            {
                username: 'testuser4',
                email: 'test4@zoo.by',
                password: 'test123',
                role: 'user',
                timezone: 'UTC',
                lastLogin: new Date('2024-11-26')
            },
            {
                username: 'testuser5',
                email: 'test5@zoo.by',
                password: 'test123',
                role: 'user',
                timezone: 'UTC',
                lastLogin: new Date('2024-11-25')
            }
        ]);

        console.log(`Создано ${users.length} пользователей`);

        const products = await Product.create([
            {
                name: 'Корм для кошек "Whiskas"',
                sku: 'CAT-FOOD-001',
                description: 'Сбалансированный сухой корм для взрослых кошек всех пород, содержит таурин, витамины и минералы',
                category: 'Корма',
                animalType: ['Кошка'],
                currentPrice: 45.50,
                unit: 'кг',
                inStock: true,
                stockQuantity: 150,
                minStockLevel: 20,
                imageUrl: 'https://avatars.mds.yandex.net/i?id=7d2b39bb6d3d4698c39dbdc6057b9bef_l-3850454-images-thumbs&n=13'
            },
            {
                name: 'Нейлоновый ошейник для собак',
                sku: 'DOG-ACC-002',
                description: 'Прочный нейлоновый ошейник с металлической пряжкой, регулируемый размер от 25 до 45 см',
                category: 'Аксессуары',
                animalType: ['Собака'],
                currentPrice: 25.99,
                unit: 'шт',
                inStock: true,
                stockQuantity: 75,
                minStockLevel: 15,
                imageUrl: 'https://ir.ozone.ru/s3/multimedia-x/6273183153.jpg'
            },
            {
                name: 'Игрушка для кошек "Мячик"',
                sku: 'CAT-TOY-003',
                description: 'Яркий мячик с разноцветными перьями для активных игр, безопасный нетоксичный материал',
                category: 'Игрушки',
                animalType: ['Кошка'],
                currentPrice: 8.50,
                unit: 'шт',
                inStock: true,
                stockQuantity: 200,
                minStockLevel: 30,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/1925870/2a000001920b395e5ffd93ab71fd7c3d6887/orig'
            },
            {
                name: 'Стеклянный аквариум 50 л',
                sku: 'FISH-TANK-004',
                description: 'Комплектный аквариум со светодиодной подсветкой, внутренним фильтром и крышкой',
                category: 'Аксессуары',
                animalType: ['Рыбка'],
                currentPrice: 175.00,
                unit: 'шт',
                inStock: true,
                stockQuantity: 12,
                minStockLevel: 3,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/4334326/img_id7503054822459220711.jpeg/orig'
            },
            {
                name: 'Корм для собак "Pedigree"',
                sku: 'DOG-FOOD-005',
                description: 'Полноценный сухой корм для взрослых собак всех пород, обогащенный кальцием',
                category: 'Корма',
                animalType: ['Собака'],
                currentPrice: 68.90,
                unit: 'кг',
                inStock: true,
                stockQuantity: 180,
                minStockLevel: 25,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/3922047/img_id9009923990064385366.jpeg/orig'
            },
            {
                name: 'Клетка для птиц',
                sku: 'BIRD-CAGE-006',
                description: 'Просторная клетка из нержавеющей стали с 2 жердочками, поилкой и кормушкой',
                category: 'Аксессуары',
                animalType: ['Птица'],
                currentPrice: 140.50,
                unit: 'шт',
                inStock: true,
                stockQuantity: 8,
                minStockLevel: 2,
                imageUrl: 'https://main-cdn.sbermegamarket.ru/big1/hlr-system/155/550/201/698/927/100074667393b0.png'
            },
            {
                name: 'Ветеринарный шампунь для животных',
                sku: 'PET-SHAM-007',
                description: 'Шампунь для чувствительной кожи собак и кошек, не вызывает раздражения',
                category: 'Гигиена',
                animalType: ['Собака', 'Кошка'],
                currentPrice: 18.75,
                unit: 'л',
                inStock: true,
                stockQuantity: 45,
                minStockLevel: 10,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/12022975/2a0000019012568b697bda83698b8fcbee71/orig'
            },
            {
                name: 'Пластиковая переноска для кошек',
                sku: 'CAT-CARR-008',
                description: 'Прочная пластиковая переноска с металлической дверцей и вентиляционными отверстиями',
                category: 'Переноски',
                animalType: ['Кошка'],
                currentPrice: 75.00,
                unit: 'шт',
                inStock: true,
                stockQuantity: 20,
                minStockLevel: 5,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/12579532/2a0000018d5714e868228db3fc3743212b8b/orig'
            },
            {
                name: 'Корм для  рыб "TetraMin"',
                sku: 'FISH-FOOD-009',
                description: 'Основной корм в виде хлопьев для всех видов тропических аквариумных рыб',
                category: 'Корма',
                animalType: ['Рыбка'],
                currentPrice: 12.50,
                unit: 'г',
                inStock: true,
                stockQuantity: 120,
                minStockLevel: 20,
                imageUrl: 'https://avatars.mds.yandex.net/i?id=5361b0d7ff266688367717897fde662c_l-4613464-images-thumbs&n=13'
            },
            {
                name: 'Деревянный домик для грызунов',
                sku: 'RODENT-HOME-010',
                description: 'Натуральный деревянный домик для хомяков, морских свинок и других грызунов',
                category: 'Аксессуары',
                animalType: ['Грызун'],
                currentPrice: 30.00,
                unit: 'шт',
                inStock: true,
                stockQuantity: 35,
                minStockLevel: 8,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/11450294/2a0000018b4cb6d58cf638b015bec38d8c62/orig'
            },
            {
                name: 'Нейлоновый поводок для собак',
                sku: 'DOG-LEASH-011',
                description: 'Прочный поводок из нейлона с металлическим карабином, длина 2 метра',
                category: 'Аксессуары',
                animalType: ['Собака'],
                currentPrice: 16.40,
                unit: 'шт',
                inStock: true,
                stockQuantity: 60,
                minStockLevel: 12,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/15249557/2a000001967d477ea0d3bc04d60333751de6/orig'
            },
            {
                name: 'Картонная когтеточка для кошек',
                sku: 'CAT-SCRATCH-012',
                description: 'Когтеточка из гофрированного картона, пропитанная кошачьей мятой',
                category: 'Аксессуары',
                animalType: ['Кошка'],
                currentPrice: 14.90,
                unit: 'шт',
                inStock: true,
                stockQuantity: 90,
                minStockLevel: 15,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/16505546/2a0000019741bb98a7a19deadfe93c6faffa/orig'
            },
            {
                name: 'Керамическая миска для животных',
                sku: 'PET-BOWL-013',
                description: 'Тяжелая керамическая миска с нескользящим резиновым дном',
                category: 'Аксессуары',
                animalType: ['Собака', 'Кошка'],
                currentPrice: 9.90,
                unit: 'шт',
                inStock: true,
                stockQuantity: 150,
                minStockLevel: 25,
                imageUrl: 'https://main-cdn.sbermegamarket.ru/big1/hlr-system/-49/834/140/151/620/16/100051626811b0.jpg'
            },
            {
                name: 'Древесный наполнитель для кошачьего туалета',
                sku: 'CAT-LITTER-014',
                description: 'Экологически чистый наполнитель из прессованных опилок, отличная впитываемость',
                category: 'Гигиена',
                animalType: ['Кошка'],
                currentPrice: 22.50,
                unit: 'л',
                inStock: true,
                stockQuantity: 80,
                minStockLevel: 15,
                imageUrl: 'https://avatars.mds.yandex.net/get-mpic/3707358/2a000001905bbc1f2c52628e5c7e0deba73b/orig'
            },
            {
                name: 'Прочная резиновая кость для собак',
                sku: 'DOG-TOY-015',
                description: 'Игрушка из натурального каучука для жевания, очищает зубы',
                category: 'Игрушки',
                animalType: ['Собака'],
                currentPrice: 11.25,
                unit: 'шт',
                inStock: true,
                stockQuantity: 110,
                minStockLevel: 20,
                imageUrl: 'https://cdn1.ozone.ru/s3/multimedia-k/6190581428.jpg'
            }
        ]);

        console.log(`Создано ${products.length} товаров`);

        const suppliers = await Supplier.create([
            {
                name: 'ЗооМаркет',
                address: {
                    street: 'ул. Якуба Коласа, 25',
                    city: 'Минск',
                    country: 'Беларусь',
                    postalCode: '220013'
                },
                phone: '+375171234567',
                email: 'info@zoomarket.by',
                rating: 4.7,
                isActive: true,
                products: [
                    { product: products[0]._id, sku: products[0].sku, stockQuantity: 500, price: 40.00 },
                    { product: products[1]._id, sku: products[1].sku, stockQuantity: 300, price: 22.00 },
                    { product: products[2]._id, sku: products[2].sku, stockQuantity: 1000, price: 7.00 }
                ]
            },
            {
                name: 'PetHouse International',
                address: {
                    street: 'пр. Независимости, 58',
                    city: 'Минск',
                    country: 'Беларусь',
                    postalCode: '220005'
                },
                phone: '+375299876543',
                email: 'sales@pethouse.by',
                rating: 4.5,
                isActive: true,
                products: [
                    { product: products[3]._id, sku: products[3].sku, stockQuantity: 50, price: 150.00 },
                    { product: products[4]._id, sku: products[4].sku, stockQuantity: 800, price: 60.00 },
                    { product: products[5]._id, sku: products[5].sku, stockQuantity: 30, price: 120.00 }
                ]
            },
            {
                name: 'АкваМир',
                address: {
                    street: 'ул. Советская, 12',
                    city: 'Гомель',
                    country: 'Беларусь',
                    postalCode: '246050'
                },
                phone: '+375255554433',
                email: 'gomel@aquamir.by',
                rating: 4.3,
                isActive: true,
                products: [
                    { product: products[6]._id, sku: products[6].sku, stockQuantity: 200, price: 16.00 },
                    { product: products[7]._id, sku: products[7].sku, stockQuantity: 100, price: 65.00 },
                    { product: products[8]._id, sku: products[8].sku, stockQuantity: 500, price: 10.00 }
                ]
            },
            {
                name: 'ЗооЛюкс',
                address: {
                    street: 'ул. Ленина, 34',
                    city: 'Витебск',
                    country: 'Беларусь',
                    postalCode: '210015'
                },
                phone: '+375331112233',
                email: 'vitebsk@zoolux.by',
                rating: 4.2,
                isActive: true,
                products: [
                    { product: products[9]._id, sku: products[9].sku, stockQuantity: 150, price: 25.00 },
                    { product: products[10]._id, sku: products[10].sku, stockQuantity: 400, price: 14.00 },
                    { product: products[11]._id, sku: products[11].sku, stockQuantity: 600, price: 12.00 }
                ]
            },
            {
                name: 'PetCare',
                address: {
                    street: 'ул. Московская, 65',
                    city: 'Брест',
                    country: 'Беларусь',
                    postalCode: '224000'
                },
                phone: '+375444445566',
                email: 'brest@petcare.by',
                rating: 4.8,
                isActive: true,
                products: [
                    { product: products[12]._id, sku: products[12].sku, stockQuantity: 800, price: 8.00 },
                    { product: products[13]._id, sku: products[13].sku, stockQuantity: 400, price: 19.00 },
                    { product: products[14]._id, sku: products[14].sku, stockQuantity: 700, price: 9.00 }
                ]
            },
            {
                name: 'БелЗооСнаб',
                address: {
                    street: 'ул. Козлова, 15',
                    city: 'Могилев',
                    country: 'Беларусь',
                    postalCode: '212030'
                },
                phone: '+375297778899',
                email: 'mogilev@belzoosnab.by',
                rating: 4.1,
                isActive: true,
                products: [
                    { product: products[14]._id, sku: products[14].sku, stockQuantity: 200, price: 48.00 },
                    { product: products[1]._id, sku: products[1].sku, stockQuantity: 150, price: 36.00 },
                    { product: products[12]._id, sku: products[12].sku, stockQuantity: 40, price: 180.00 }
                ]
            },
            {
                name: 'ЗооТовары',
                address: {
                    street: 'ул. Ожешко, 22',
                    city: 'Гродно',
                    country: 'Беларусь',
                    postalCode: '230023'
                },
                phone: '+375173334455',
                email: 'grodno@zootovary.by',
                rating: 4.4,
                isActive: true,
                products: [
                    { product: products[3]._id, sku: products[3].sku, stockQuantity: 1000, price: 30.00 },
                    { product: products[5]._id, sku: products[5].sku, stockQuantity: 900, price: 28.00 }
                ]
            },
            {
                name: 'АкваГрад',
                address: {
                    street: 'ул. Тимирязева, 9',
                    city: 'Минск',
                    country: 'Беларусь',
                    postalCode: '220035'
                },
                phone: '+375293334455',
                email: 'aquagrad@mail.by',
                rating: 4.6,
                isActive: true,
                products: [
                    { product: products[3]._id, sku: products[3].sku, stockQuantity: 30, price: 160.00 },
                    { product: products[8]._id, sku: products[8].sku, stockQuantity: 300, price: 11.00 }
                ]
            },
            {
                name: 'Птичий Рай',
                address: {
                    street: 'ул. Комсомольская, 3',
                    city: 'Барановичи',
                    country: 'Беларусь',
                    postalCode: '225320'
                },
                phone: '+375441112233',
                email: 'birds@mail.by',
                rating: 4.0,
                isActive: true,
                products: [
                    { product: products[5]._id, sku: products[5].sku, stockQuantity: 20, price: 130.00 },
                    { product: products[9]._id, sku: products[9].sku, stockQuantity: 500, price: 32.00 }
                ]
            },
            {
                name: 'КотоДом',
                address: {
                    street: 'ул. Ленина, 7',
                    city: 'Солигорск',
                    country: 'Беларусь',
                    postalCode: '223710'
                },
                phone: '+375256667788',
                email: 'kotodom@tut.by',
                rating: 4.9,
                isActive: true,
                products: [
                    { product: products[0]._id, sku: products[0].sku, stockQuantity: 400, price: 42.00 },
                    { product: products[2]._id, sku: products[2].sku, stockQuantity: 800, price: 7.50 },
                    { product: products[13]._id, sku: products[13].sku, stockQuantity: 300, price: 20.00 }
                ]
            },
            {
                name: 'Собачий Мастер',
                address: {
                    street: 'ул. 3 Интернационала, 45',
                    city: 'Борисов',
                    country: 'Беларусь',
                    postalCode: '222120'
                },
                phone: '+375337776655',
                email: 'dogmaster@mail.ru',
                rating: 4.3,
                isActive: true,
                products: [
                    { product: products[1]._id, sku: products[1].sku, stockQuantity: 200, price: 23.00 },
                    { product: products[4]._id, sku: products[4].sku, stockQuantity: 500, price: 62.00 },
                    { product: products[10]._id, sku: products[10].sku, stockQuantity: 250, price: 15.00 }
                ]
            },
            {
                name: 'Грызун-Экспресс',
                address: {
                    street: 'ул. Мира, 18',
                    city: 'Орша',
                    country: 'Беларусь',
                    postalCode: '211030'
                },
                phone: '+375296665544',
                email: 'rodents@tut.by',
                rating: 4.2,
                isActive: true,
                products: [
                    { product: products[9]._id, sku: products[9].sku, stockQuantity: 100, price: 27.00 },
                    { product: products[1]._id, sku: products[1].sku, stockQuantity: 400, price: 31.00 }
                ]
            },
            {
                name: 'Рептилия-Про',
                address: {
                    street: 'ул. Советская, 56',
                    city: 'Жодино',
                    country: 'Беларусь',
                    postalCode: '222160'
                },
                phone: '+375445556677',
                email: 'reptiles@mail.by',
                rating: 4.1,
                isActive: true,
                products: [
                    { product: products[7]._id, sku: products[7].sku, stockQuantity: 25, price: 190.00 }
                ]
            },
            {
                name: 'УниверсалЗоо',
                address: {
                    street: 'ул. Молодежная, 12',
                    city: 'Новополоцк',
                    country: 'Беларусь',
                    postalCode: '211440'
                },
                phone: '+375254448899',
                email: 'unizoo@mail.ru',
                rating: 4.0,
                isActive: true,
                products: [
                    { product: products[12]._id, sku: products[12].sku, stockQuantity: 500, price: 8.50 },
                    { product: products[14]._id, sku: products[14].sku, stockQuantity: 400, price: 10.00 },
                    { product: products[6]._id, sku: products[6].sku, stockQuantity: 600, price: 30.00 }
                ]
            }
        ]);

        console.log(`Создано ${suppliers.length} поставщиков`);

        const purchaseStatuses = ['ordered', 'delivered', 'pending', 'cancelled'];
        const purchases = [];

        for (let i = 0; i < 20; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
            const user = users[Math.floor(Math.random() * users.length)];

            const purchaseDate = new Date();
            purchaseDate.setDate(purchaseDate.getDate() - Math.floor(Math.random() * 90));

            const deliveryDate = new Date(purchaseDate);
            deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 14) + 2);

            const supplierProduct = supplier.products.find(p => p.product.toString() === product._id.toString());
            const purchasePrice = supplierProduct ? supplierProduct.price * (0.9 + Math.random() * 0.2) : product.currentPrice * 0.8;

            const quantity = Math.floor(Math.random() * 50) + 10;
            const status = purchaseStatuses[Math.floor(Math.random() * purchaseStatuses.length)];

            purchases.push({
                product: product._id,
                supplier: supplier._id,
                quantity: quantity,
                purchasePrice: parseFloat(purchasePrice.toFixed(2)),
                purchaseDate: purchaseDate,
                deliveryDate: status === 'delivered' ? deliveryDate : null,
                status: status,
                invoiceNumber: `INV-${20240000 + i}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                notes: `Закупка ${product.name} у ${supplier.name}`,
                createdBy: user._id
            });
        }

        const createdPurchases = await Purchase.create(purchases);
        console.log(`Создано ${createdPurchases.length} закупок`);

        const priceChanges = [];

        for (let i = 0; i < 25; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
            const user = users[Math.floor(Math.random() * users.length)];

            const changeDate = new Date();
            changeDate.setDate(changeDate.getDate() - Math.floor(Math.random() * 180));

            const notificationDate = new Date(changeDate);
            notificationDate.setDate(notificationDate.getDate() - Math.floor(Math.random() * 7));

            const effectiveDate = new Date(changeDate);
            effectiveDate.setDate(effectiveDate.getDate() + Math.floor(Math.random() * 30));

            const oldPrice = product.currentPrice * (0.7 + Math.random() * 0.4);
            const newPrice = product.currentPrice * (0.9 + Math.random() * 0.3);

            const reasons = [
                'Изменение курса валют',
                'Изменение цены поставщиком',
                'Сезонное изменение спроса',
                'Изменение транспортных расходов',
                'Акция поставщика',
                'Изменение таможенных пошлин',
                'Изменение себестоимости производства',
                'Инфляционные процессы',
                'Конкурентное ценообразование',
                'Оптовая скидка'
            ];

            const requiresConfirmation = Math.abs((newPrice - oldPrice) / oldPrice * 100) > 30;
            const applied = effectiveDate <= new Date() && !requiresConfirmation;
            const appliedDate = applied ? new Date(effectiveDate) : null;

            priceChanges.push({
                product: product._id,
                supplier: supplier._id,
                oldPrice: parseFloat(oldPrice.toFixed(2)),
                newPrice: parseFloat(newPrice.toFixed(2)),
                changeDate: changeDate,
                notificationDate: notificationDate,
                effectiveDate: effectiveDate,
                reason: reasons[Math.floor(Math.random() * reasons.length)],
                notified: Math.random() > 0.3,
                applied: applied,
                appliedDate: appliedDate,
                requiresConfirmation: requiresConfirmation,
                confirmedBy: requiresConfirmation && applied ? users[0]._id : null,
                confirmationDate: requiresConfirmation && applied ? new Date(effectiveDate) : null,
                createdBy: user._id
            });
        }

        const createdPriceChanges = await PriceChange.create(priceChanges);
        console.log(`Создано ${createdPriceChanges.length} изменений цен`);

        for (const product of products) {
            const latestAppliedChange = await PriceChange.findOne({
                product: product._id,
                applied: true
            }).sort({ effectiveDate: -1 });

            if (latestAppliedChange) {
                product.currentPrice = latestAppliedChange.newPrice;
                await product.save();
            }
        }

        console.log('База данных успешно заполнена!');

        process.exit(0);
    } catch (error) {
        console.error('Ошибка при заполнении базы данных:');
        console.error('Имя ошибки:', error.name);
        console.error('Сообщение ошибки:', error.message);
        console.error('Стек ошибки:', error.stack);

        if (error.code) {
            console.error('Код ошибки:', error.code);
        }

        if (error.reason) {
            console.error('Причина ошибки:', error.reason);
        }

        process.exit(1);
    }
};

seedDatabase();