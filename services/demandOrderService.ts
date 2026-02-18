import { DemandOrder, DemandOrderStatus } from '../types';

const STORAGE_KEY = 'caditare_demand_orders';

const MOCK_DEMAND_ORDERS: DemandOrder[] = [
    {
        id: 'do-1',
        employerId: 'emp-1',
        title: '20x Construction Workers',
        jobCategory: 'Construction',
        country: 'United Arab Emirates',
        location: 'Dubai',
        positionsRequired: 20,
        positionsFilled: 3,
        salaryRange: '$1,200 - $1,800/month',
        contractDuration: '2 years',
        benefits: ['Accommodation', 'Transport', 'Medical Insurance'],
        requirements: ['3+ years experience', 'Physical fitness', 'Safety certification'],
        status: DemandOrderStatus.OPEN,
        createdAt: '2024-01-10T00:00:00Z',
        deadline: '2024-04-01',
        notes: 'Urgent requirement for Al Maktoum project Phase 3',
    },
    {
        id: 'do-2',
        employerId: 'emp-2',
        title: '10x Hotel Staff',
        jobCategory: 'Hospitality',
        country: 'Qatar',
        location: 'Doha',
        positionsRequired: 10,
        positionsFilled: 1,
        salaryRange: '$900 - $1,400/month',
        contractDuration: '2 years',
        benefits: ['Accommodation', 'Food', 'Uniform'],
        requirements: ['Customer service experience', 'English proficiency', 'Hospitality background'],
        status: DemandOrderStatus.OPEN,
        createdAt: '2024-01-18T00:00:00Z',
        deadline: '2024-05-15',
    },
    {
        id: 'do-3',
        employerId: 'emp-3',
        title: '15x Factory Operators',
        jobCategory: 'Manufacturing',
        country: 'Saudi Arabia',
        location: 'Riyadh',
        positionsRequired: 15,
        positionsFilled: 0,
        salaryRange: '$1,000 - $1,500/month',
        contractDuration: '1 year',
        benefits: ['Accommodation', 'Transport'],
        requirements: ['Technical skills', 'Shift work availability', 'Quality control knowledge'],
        status: DemandOrderStatus.OPEN,
        createdAt: '2024-02-01T00:00:00Z',
        deadline: '2024-06-30',
    },
];

export class DemandOrderService {
    static getAll(): DemandOrder[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Failed to parse demand orders', e);
            }
        }
        this.saveAll(MOCK_DEMAND_ORDERS);
        return MOCK_DEMAND_ORDERS;
    }

    static saveAll(orders: DemandOrder[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }

    static getById(id: string): DemandOrder | undefined {
        return this.getAll().find(o => o.id === id);
    }

    static getByEmployerId(employerId: string): DemandOrder[] {
        return this.getAll().filter(o => o.employerId === employerId);
    }

    static getOpenOrders(): DemandOrder[] {
        return this.getAll().filter(o =>
            o.status === DemandOrderStatus.OPEN ||
            o.status === DemandOrderStatus.PARTIALLY_FILLED
        );
    }

    static add(order: DemandOrder): void {
        const orders = this.getAll();
        orders.push(order);
        this.saveAll(orders);
    }

    static update(updated: DemandOrder): void {
        const orders = this.getAll();
        const index = orders.findIndex(o => o.id === updated.id);
        if (index !== -1) {
            orders[index] = updated;
            this.saveAll(orders);
        }
    }

    static delete(id: string): void {
        const orders = this.getAll().filter(o => o.id !== id);
        this.saveAll(orders);
    }

    static incrementFilled(orderId: string): void {
        const order = this.getById(orderId);
        if (order) {
            order.positionsFilled = Math.min(order.positionsFilled + 1, order.positionsRequired);
            if (order.positionsFilled >= order.positionsRequired) {
                order.status = DemandOrderStatus.FILLED;
            } else if (order.positionsFilled > 0) {
                order.status = DemandOrderStatus.PARTIALLY_FILLED;
            }
            this.update(order);
        }
    }
}
