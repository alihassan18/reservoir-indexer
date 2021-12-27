import { Request, RouteOptions } from "@hapi/hapi";
import Joi from "joi";

import { wyvernV2OrderFormat } from "@/api/types";
import { logger } from "@/common/logger";
import * as wyvernV2 from "@/orders/wyvern-v2";

export const getOrdersBuildOptions: RouteOptions = {
  description: "Build order",
  tags: ["api"],
  validate: {
    query: Joi.object({
      contract: Joi.string().lowercase(),
      tokenId: Joi.string(),
      collection: Joi.string().lowercase(),
      // TODO: Integrate attributes once attribute-based orders are supported
      maker: Joi.string().required(),
      side: Joi.string().lowercase().valid("sell", "buy").required(),
      price: Joi.string().required(),
      fee: Joi.alternatives(Joi.string(), Joi.number()).required(),
      feeRecipient: Joi.string().required(),
      listingTime: Joi.alternatives(Joi.string(), Joi.number()),
      expirationTime: Joi.alternatives(Joi.string(), Joi.number()),
      salt: Joi.string(),
    })
      // TODO: Only the following combinations should be allowed:
      // - contract + tokenId
      // - collection
      // - collection + attributes
      .or("contract", "collection")
      .oxor("contract", "collection"),
  },
  response: {
    schema: Joi.object({
      order: Joi.object({
        chainId: Joi.number(),
        // TODO: When time comes, add support for other order formats
        // apart from WyvernV2 which is the only one supported for now
        params: wyvernV2OrderFormat,
      }),
    }).label("getOrdersBuildResponse"),
    failAction: (_request, _h, error) => {
      logger.error(
        "get_orders_build_handler",
        `Wrong response schema: ${error}`
      );
      throw error;
    },
  },
  handler: async (request: Request) => {
    const query = request.query as any;

    try {
      const order = await wyvernV2.buildOrder(
        query as wyvernV2.BuildOrderOptions
      );

      if (!order) {
        return { order: null };
      }

      return { order };
    } catch (error) {
      logger.error("get_orders_build_handler", `Handler failure: ${error}`);
      throw error;
    }
  },
};
