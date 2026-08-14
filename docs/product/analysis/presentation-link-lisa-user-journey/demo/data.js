window.LISA_PROTOTYPE_DATA = Object.freeze({
  "version": "3.0.0",
  "initial_state_id": "lisa-materials-summary",
  "order_target_state_id": "lisa-presentation-generating",
  "navigation": {
    "display_total": 11
  },
  "device": {
    "model": "iPhone 12 Pro Max",
    "body_mm": {
      "width": 78.1,
      "height": 160.8
    },
    "screen_px": {
      "width": 428,
      "height": 926
    },
    "inner_window_px": {
      "width": 521,
      "height": 980
    },
    "source_body_viewport": {
      "x": 64,
      "y": 48,
      "width": 393,
      "height": 852
    },
    "source_canvas_margins": {
      "left": 64,
      "top": 48,
      "right": 64,
      "bottom": 80
    },
    "source_body_corner_radius": 32
  },
  "states": [
    {
      "id": "lisa-materials-summary",
      "order": 1,
      "display_order": 2,
      "source_id": "5.2",
      "caption": "Краткие материалы: заказ доступен сразу",
      "presentation": "phone",
      "scrollable": false,
      "action_ids": [
        "order-presentation"
      ],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 852
      },
      "logical_dimensions": {
        "width": 521,
        "height": 980
      },
      "cta_rect": {
        "x": 80,
        "y": 754,
        "width": 361,
        "height": 40
      },
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-materials-summary-status-3x.png",
          "source_rect": {
            "x": 64,
            "y": 48,
            "width": 393,
            "height": 53
          },
          "viewport_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "destination_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 159
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 3
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-materials-summary-content-3x.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 765
          },
          "viewport_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "destination_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 2295
          },
          "logical_dimensions": {
            "width": 393,
            "height": 765
          },
          "raster_scale": 3
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-materials-summary-home-3x.png",
          "source_rect": {
            "x": 64,
            "y": 866,
            "width": 393,
            "height": 34
          },
          "viewport_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "destination_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 102
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 3
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-materials-summary-status-3x.png",
            "source_rect": {
              "x": 64,
              "y": 48,
              "width": 393,
              "height": 53
            },
            "viewport_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "destination_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 159
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 3
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-materials-summary-content-3x.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 765
            },
            "viewport_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "destination_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 2295
            },
            "logical_dimensions": {
              "width": 393,
              "height": 765
            },
            "raster_scale": 3
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-materials-summary-home-3x.png",
            "source_rect": {
              "x": 64,
              "y": 866,
              "width": 393,
              "height": 34
            },
            "viewport_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "destination_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 102
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 3
          }
        ]
      }
    },
    {
      "id": "lisa-materials-full-reference",
      "order": 2,
      "display_order": 3,
      "source_id": "5.4",
      "caption": "Полная справка: прокрутите материалы или оформите заказ",
      "presentation": "phone",
      "scrollable": true,
      "action_ids": [
        "order-presentation"
      ],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 5066
      },
      "logical_dimensions": {
        "width": 521,
        "height": 5194
      },
      "cta_rect": {
        "x": 80,
        "y": 4968,
        "width": 361,
        "height": 40
      },
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-materials-full-reference-status-3x.png",
          "source_rect": {
            "x": 64,
            "y": 48,
            "width": 393,
            "height": 53
          },
          "viewport_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "destination_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 159
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 3
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-materials-full-reference-content-3x.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 4979
          },
          "viewport_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "destination_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 14937
          },
          "logical_dimensions": {
            "width": 393,
            "height": 4979
          },
          "raster_scale": 3
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-materials-full-reference-home-3x.png",
          "source_rect": {
            "x": 64,
            "y": 5080,
            "width": 393,
            "height": 34
          },
          "viewport_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "destination_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 102
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 3
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-materials-full-reference-status-3x.png",
            "source_rect": {
              "x": 64,
              "y": 48,
              "width": 393,
              "height": 53
            },
            "viewport_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "destination_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 159
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 3
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-materials-full-reference-content-3x.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 4979
            },
            "viewport_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "destination_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 14937
            },
            "logical_dimensions": {
              "width": 393,
              "height": 4979
            },
            "raster_scale": 3
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-materials-full-reference-home-3x.png",
            "source_rect": {
              "x": 64,
              "y": 5080,
              "width": 393,
              "height": 34
            },
            "viewport_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "destination_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 102
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 3
          }
        ]
      }
    },
    {
      "id": "lisa-presentation-order",
      "order": 3,
      "display_order": 4,
      "source_id": "7.1",
      "caption": "Заказ презентации по подготовленным материалам",
      "presentation": "phone",
      "scrollable": false,
      "action_ids": [
        "order-presentation"
      ],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 852
      },
      "logical_dimensions": {
        "width": 521,
        "height": 980
      },
      "cta_rect": {
        "x": 80,
        "y": 678,
        "width": 361,
        "height": 40
      },
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-presentation-order-status-3x.png",
          "source_rect": {
            "x": 64,
            "y": 48,
            "width": 393,
            "height": 53
          },
          "viewport_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "destination_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 159
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 3
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-presentation-order-content-3x.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 765
          },
          "viewport_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "destination_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 2295
          },
          "logical_dimensions": {
            "width": 393,
            "height": 765
          },
          "raster_scale": 3
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-presentation-order-home-3x.png",
          "source_rect": {
            "x": 64,
            "y": 866,
            "width": 393,
            "height": 34
          },
          "viewport_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "destination_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 102
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 3
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-presentation-order-status-3x.png",
            "source_rect": {
              "x": 64,
              "y": 48,
              "width": 393,
              "height": 53
            },
            "viewport_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "destination_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 159
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 3
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-presentation-order-content-3x.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 765
            },
            "viewport_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "destination_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 2295
            },
            "logical_dimensions": {
              "width": 393,
              "height": 765
            },
            "raster_scale": 3
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-presentation-order-home-3x.png",
            "source_rect": {
              "x": 64,
              "y": 866,
              "width": 393,
              "height": 34
            },
            "viewport_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "destination_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 102
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 3
          }
        ]
      }
    },
    {
      "id": "lisa-presentation-generating",
      "order": 4,
      "display_order": 5,
      "source_id": "7.2",
      "caption": "Презентация формируется",
      "presentation": "phone",
      "scrollable": false,
      "action_ids": [],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 852
      },
      "logical_dimensions": {
        "width": 521,
        "height": 980
      },
      "cta_rect": null,
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-presentation-generating-status-3x.png",
          "source_rect": {
            "x": 64,
            "y": 48,
            "width": 393,
            "height": 53
          },
          "viewport_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "destination_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 159
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 3
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-presentation-generating-content-3x.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 765
          },
          "viewport_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "destination_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 2295
          },
          "logical_dimensions": {
            "width": 393,
            "height": 765
          },
          "raster_scale": 3
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-presentation-generating-home-3x.png",
          "source_rect": {
            "x": 64,
            "y": 866,
            "width": 393,
            "height": 34
          },
          "viewport_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "destination_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 102
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 3
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-presentation-generating-status-3x.png",
            "source_rect": {
              "x": 64,
              "y": 48,
              "width": 393,
              "height": 53
            },
            "viewport_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "destination_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 159
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 3
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-presentation-generating-content-3x.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 765
            },
            "viewport_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "destination_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 2295
            },
            "logical_dimensions": {
              "width": 393,
              "height": 765
            },
            "raster_scale": 3
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-presentation-generating-home-3x.png",
            "source_rect": {
              "x": 64,
              "y": 866,
              "width": 393,
              "height": 34
            },
            "viewport_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "destination_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 102
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 3
          }
        ]
      }
    },
    {
      "id": "lisa-presentation-chat-list",
      "order": 5,
      "display_order": 6,
      "source_id": "08",
      "caption": "Чаты: ГК Достовалова",
      "presentation": "phone",
      "scrollable": false,
      "action_ids": [],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 852
      },
      "logical_dimensions": {
        "width": 521,
        "height": 980
      },
      "cta_rect": null,
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-presentation-chat-list-status-3x.png",
          "source_rect": {
            "x": 64,
            "y": 48,
            "width": 393,
            "height": 53
          },
          "viewport_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "destination_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 159
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 3
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-presentation-chat-list-content-3x.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 765
          },
          "viewport_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "destination_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 2295
          },
          "logical_dimensions": {
            "width": 393,
            "height": 765
          },
          "raster_scale": 3
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-presentation-chat-list-home-3x.png",
          "source_rect": {
            "x": 64,
            "y": 866,
            "width": 393,
            "height": 34
          },
          "viewport_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "destination_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 102
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 3
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-presentation-chat-list-status-3x.png",
            "source_rect": {
              "x": 64,
              "y": 48,
              "width": 393,
              "height": 53
            },
            "viewport_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "destination_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 159
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 3
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-presentation-chat-list-content-3x.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 765
            },
            "viewport_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "destination_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 2295
            },
            "logical_dimensions": {
              "width": 393,
              "height": 765
            },
            "raster_scale": 3
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-presentation-chat-list-home-3x.png",
            "source_rect": {
              "x": 64,
              "y": 866,
              "width": 393,
              "height": 34
            },
            "viewport_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "destination_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 102
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 3
          }
        ]
      }
    },
    {
      "id": "lisa-presentation-sent",
      "order": 6,
      "display_order": 7,
      "source_id": "7.3",
      "caption": "Презентация сформирована и отправлена",
      "presentation": "phone",
      "scrollable": false,
      "action_ids": [],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 852
      },
      "logical_dimensions": {
        "width": 521,
        "height": 980
      },
      "cta_rect": null,
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-presentation-sent-status-3x.png",
          "source_rect": {
            "x": 64,
            "y": 48,
            "width": 393,
            "height": 53
          },
          "viewport_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "destination_rect": {
            "x": 0,
            "y": 0,
            "width": 393,
            "height": 53
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 159
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 3
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-presentation-sent-content-3x.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 765
          },
          "viewport_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "destination_rect": {
            "x": 0,
            "y": 53,
            "width": 393,
            "height": 765
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 2295
          },
          "logical_dimensions": {
            "width": 393,
            "height": 765
          },
          "raster_scale": 3
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-presentation-sent-home-3x.png",
          "source_rect": {
            "x": 64,
            "y": 866,
            "width": 393,
            "height": 34
          },
          "viewport_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "destination_rect": {
            "x": 0,
            "y": 818,
            "width": 393,
            "height": 34
          },
          "pixel_dimensions": {
            "width": 1179,
            "height": 102
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 3
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-presentation-sent-status-3x.png",
            "source_rect": {
              "x": 64,
              "y": 48,
              "width": 393,
              "height": 53
            },
            "viewport_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "destination_rect": {
              "x": 0,
              "y": 0,
              "width": 393,
              "height": 53
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 159
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 3
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-presentation-sent-content-3x.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 765
            },
            "viewport_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "destination_rect": {
              "x": 0,
              "y": 53,
              "width": 393,
              "height": 765
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 2295
            },
            "logical_dimensions": {
              "width": 393,
              "height": 765
            },
            "raster_scale": 3
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-presentation-sent-home-3x.png",
            "source_rect": {
              "x": 64,
              "y": 866,
              "width": 393,
              "height": 34
            },
            "viewport_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "destination_rect": {
              "x": 0,
              "y": 818,
              "width": 393,
              "height": 34
            },
            "pixel_dimensions": {
              "width": 1179,
              "height": 102
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 3
          }
        ]
      }
    },
    {
      "id": "lisa-presentation-email",
      "order": 7,
      "display_order": 8,
      "source_id": "7.4",
      "caption": "Письмо с версиями презентации в ODT и PDF",
      "presentation": "desktop",
      "scrollable": false,
      "action_ids": [],
      "viewport": {
        "width": 1553,
        "height": 1013
      },
      "content": {
        "width": 1553,
        "height": 1013
      },
      "logical_dimensions": {
        "width": 1553,
        "height": 1013
      },
      "cta_rect": null,
      "asset": {
        "src": "assets/lisa-presentation-email.png",
        "logical_dimensions": {
          "width": 1553,
          "height": 1013
        },
        "pixel_dimensions": {
          "width": 1553,
          "height": 1013
        },
        "raster_scale": 1
      }
    },
    {
      "id": "lisa-presentation-slidedoc",
      "order": 8,
      "display_order": 9,
      "source_id": "szh-dense-slidedoc",
      "caption": "Презентация: вариант SlideDoc",
      "presentation": "desktop",
      "scrollable": true,
      "action_ids": [],
      "viewport": {
        "width": 960,
        "height": 540
      },
      "content": {
        "width": 960,
        "height": 1620
      },
      "logical_dimensions": {
        "width": 960,
        "height": 1620
      },
      "cta_rect": null,
      "asset": {
        "src": "assets/szh-dense-slidedoc-4x.png",
        "logical_dimensions": {
          "width": 960,
          "height": 1620
        },
        "pixel_dimensions": {
          "width": 3840,
          "height": 6480
        },
        "raster_scale": 4
      }
    },
    {
      "id": "lisa-presentation-sber2025",
      "order": 9,
      "display_order": 10,
      "source_id": "szh-dense-sber2025",
      "caption": "Презентация: вариант Sber 2025",
      "presentation": "desktop",
      "scrollable": true,
      "action_ids": [],
      "viewport": {
        "width": 960,
        "height": 540
      },
      "content": {
        "width": 960,
        "height": 1620
      },
      "logical_dimensions": {
        "width": 960,
        "height": 1620
      },
      "cta_rect": null,
      "asset": {
        "src": "assets/szh-dense-sber2025-4x.png",
        "logical_dimensions": {
          "width": 960,
          "height": 1620
        },
        "pixel_dimensions": {
          "width": 3840,
          "height": 6480
        },
        "raster_scale": 4
      }
    },
    {
      "id": "lisa-presentation-mag",
      "order": 10,
      "display_order": 11,
      "source_id": "szh-dense-mag",
      "caption": "Презентация: вариант MAG",
      "presentation": "desktop",
      "scrollable": true,
      "action_ids": [],
      "viewport": {
        "width": 960,
        "height": 540
      },
      "content": {
        "width": 960,
        "height": 1620
      },
      "logical_dimensions": {
        "width": 960,
        "height": 1620
      },
      "cta_rect": null,
      "asset": {
        "src": "assets/szh-dense-mag-4x.png",
        "logical_dimensions": {
          "width": 960,
          "height": 1620
        },
        "pixel_dimensions": {
          "width": 3840,
          "height": 6480
        },
        "raster_scale": 4
      }
    }
  ],
  "actions": [
    {
      "id": "order-presentation",
      "label": "Сформировать презентацию",
      "accessible_label": "Сформировать презентацию",
      "target_state_id": "lisa-presentation-generating",
      "source_state_ids": [
        "lisa-materials-summary",
        "lisa-materials-full-reference",
        "lisa-presentation-order"
      ]
    }
  ]
});
