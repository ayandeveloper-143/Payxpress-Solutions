import type { RowDataPacket } from "mysql2";

export interface ProductRecord extends RowDataPacket {
    id: number;
    slug: string;
    title: string;
    description: string;
    tag: string;
    price_label: string;
    image: string;
    overview: string;
    short_note: string;
    full_description: string;
    screenshots: string[] | string;
    features: string[] | string;
    cart_limit: number;
}

export interface ProductResponse {
    id: number;
    slug: string;
    title: string;
    description: string;
    tag: string;
    price: string;
    image: string;
    overview: string;
    shortNote: string;
    fullDescription: string;
    screenshots: string[];
    features: string[];
    cartLimit: number;
}