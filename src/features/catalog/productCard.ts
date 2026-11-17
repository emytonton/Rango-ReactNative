import type { ProductCardModel } from '../../components';
import {
  formatDeliveryTime,
  formatPrice,
  formatRating,
} from '../../core/format/formatters';
import { apiBaseUrl } from '../../core/network/config';
import type { ProductSummary } from '../../data/catalog/catalogApi';

export function toProductCard(product: ProductSummary): ProductCardModel {
  return {
    id: product.id,
    name: product.name,
    restaurant: product.restaurant,
    description: product.description,
    price: formatPrice(product.price),
    oldPrice: product.oldPrice ? formatPrice(product.oldPrice) : null,
    rating: formatRating(product.rating),
    deliveryTime: formatDeliveryTime(
      product.deliveryTime.min,
      product.deliveryTime.max,
    ),
    imageUrl: product.imageUrl ? apiBaseUrl + product.imageUrl : null,
    imageHue: product.imageHue,
    isFavorite: product.isFavorite,
  };
}
