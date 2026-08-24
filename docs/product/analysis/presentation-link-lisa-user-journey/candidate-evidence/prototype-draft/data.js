window.LISA_PROTOTYPE_DATA = Object.freeze({
  "version": "3.0.0-draft",
  "initial_state_id": "lisa-materials-full-reference",
  "order_target_state_id": "lisa-presentation-generating",
  "lifecycle": {
    "button": {
      "enabled_in": [
        "eligible"
      ],
      "disabled_in": [
        "accepted_locked"
      ]
    },
    "messages": [
      {
        "id": "order_started",
        "authoritative_text_status": "agreed",
        "authoritative_text": "Открыт кадр начала формирования презентации."
      }
    ]
  },
  "navigation": {
    "display_total": 11
  },
  "device": {
    "model": "iPhone 12 Pro Max",
    "body_mm": {
      "width": 78.1,
      "height": 160.8
    },
    "source_body_viewport": {
      "x": 64,
      "y": 48,
      "width": 393,
      "height": 852
    },
    "source_body_corner_radius": 32
  },
  "states": [
    {
      "id": "lisa-materials-full-reference",
      "order": 1,
      "display_order": 1,
      "source_id": "owner_approved_candidate",
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
        "height": 2929
      },
      "logical_dimensions": {
        "width": 521,
        "height": 3144
      },
      "cta_rect": {
        "x": 80,
        "y": 2898,
        "width": 361,
        "height": 40
      },
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-materials-full-reference-system-top.png",
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
            "width": 393,
            "height": 53
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 1
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-materials-full-reference-scroll-content.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 2929
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
            "width": 393,
            "height": 2929
          },
          "logical_dimensions": {
            "width": 393,
            "height": 2929
          },
          "raster_scale": 1
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-materials-full-reference-system-bottom.png",
          "source_rect": {
            "x": 64,
            "y": 3030,
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
            "width": 393,
            "height": 34
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 1
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-materials-full-reference-system-top.png",
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
              "width": 393,
              "height": 53
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 1
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-materials-full-reference-scroll-content.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 2929
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
              "width": 393,
              "height": 2929
            },
            "logical_dimensions": {
              "width": 393,
              "height": 2929
            },
            "raster_scale": 1
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-materials-full-reference-system-bottom.png",
            "source_rect": {
              "x": 64,
              "y": 3030,
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
              "width": 393,
              "height": 34
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 1
          }
        ]
      }
    },
    {
      "id": "lisa-presentation-generating",
      "order": 2,
      "display_order": 2,
      "source_id": "owner_approved_candidate",
      "caption": "Презентация формируется",
      "presentation": "phone",
      "scrollable": true,
      "action_ids": [],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 3011
      },
      "logical_dimensions": {
        "width": 521,
        "height": 3226
      },
      "cta_rect": null,
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-presentation-generating-system-top.png",
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
            "width": 393,
            "height": 53
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 1
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-presentation-generating-scroll-content.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 3011
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
            "width": 393,
            "height": 3011
          },
          "logical_dimensions": {
            "width": 393,
            "height": 3011
          },
          "raster_scale": 1
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-presentation-generating-system-bottom.png",
          "source_rect": {
            "x": 64,
            "y": 3112,
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
            "width": 393,
            "height": 34
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 1
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-presentation-generating-system-top.png",
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
              "width": 393,
              "height": 53
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 1
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-presentation-generating-scroll-content.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 3011
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
              "width": 393,
              "height": 3011
            },
            "logical_dimensions": {
              "width": 393,
              "height": 3011
            },
            "raster_scale": 1
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-presentation-generating-system-bottom.png",
            "source_rect": {
              "x": 64,
              "y": 3112,
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
              "width": 393,
              "height": 34
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 1
          }
        ]
      }
    },
    {
      "id": "lisa-presentation-chat-list",
      "order": 3,
      "display_order": 3,
      "source_id": "08",
      "caption": "Чаты: ООО «Водолей Трейд»",
      "presentation": "phone",
      "scrollable": false,
      "action_ids": [],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 765
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
      "order": 4,
      "display_order": 4,
      "source_id": "owner_approved_candidate",
      "caption": "Презентация сформирована и отправлена",
      "presentation": "phone",
      "scrollable": true,
      "action_ids": [],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 3075
      },
      "logical_dimensions": {
        "width": 521,
        "height": 3290
      },
      "cta_rect": null,
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-presentation-sent-system-top.png",
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
            "width": 393,
            "height": 53
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 1
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-presentation-sent-scroll-content.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 3075
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
            "width": 393,
            "height": 3075
          },
          "logical_dimensions": {
            "width": 393,
            "height": 3075
          },
          "raster_scale": 1
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-presentation-sent-system-bottom.png",
          "source_rect": {
            "x": 64,
            "y": 3176,
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
            "width": 393,
            "height": 34
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 1
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-presentation-sent-system-top.png",
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
              "width": 393,
              "height": 53
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 1
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-presentation-sent-scroll-content.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 3075
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
              "width": 393,
              "height": 3075
            },
            "logical_dimensions": {
              "width": 393,
              "height": 3075
            },
            "raster_scale": 1
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-presentation-sent-system-bottom.png",
            "source_rect": {
              "x": 64,
              "y": 3176,
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
              "width": 393,
              "height": 34
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 1
          }
        ]
      }
    },
    {
      "id": "lisa-presentation-email",
      "order": 5,
      "display_order": 5,
      "source_id": "owner_supplied_outlook_corporate_email_screenshot_2026_08_19",
      "caption": "Письмо с версиями презентации в PPTX и PDF",
      "presentation": "desktop",
      "scrollable": false,
      "action_ids": [],
      "viewport": {
        "width": 1280,
        "height": 960
      },
      "content": {
        "width": 1280,
        "height": 960
      },
      "logical_dimensions": {
        "width": 1280,
        "height": 960
      },
      "cta_rect": null,
      "asset": {
        "src": "assets/lisa-presentation-email.png",
        "logical_dimensions": {
          "width": 1280,
          "height": 960
        },
        "pixel_dimensions": {
          "width": 1280,
          "height": 960
        },
        "raster_scale": 1
      }
    },
    {
      "id": "lisa-presentation-slidedoc",
      "order": 6,
      "display_order": 6,
      "source_id": "owner_supplied_pdf_visual_donor",
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
        "src": "assets/lisa-presentation-slidedoc.png",
        "logical_dimensions": {
          "width": 960,
          "height": 1620
        },
        "pixel_dimensions": {
          "width": 3840,
          "height": 6480
        },
        "raster_scale": 1
      }
    },
    {
      "id": "lisa-presentation-sber2025",
      "order": 7,
      "display_order": 7,
      "source_id": "owner_supplied_pdf_visual_donor",
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
        "src": "assets/lisa-presentation-sber2025.png",
        "logical_dimensions": {
          "width": 960,
          "height": 1620
        },
        "pixel_dimensions": {
          "width": 3840,
          "height": 6480
        },
        "raster_scale": 1
      }
    },
    {
      "id": "lisa-presentation-mag",
      "order": 8,
      "display_order": 8,
      "source_id": "owner_supplied_pdf_visual_donor",
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
        "src": "assets/lisa-presentation-mag.png",
        "logical_dimensions": {
          "width": 960,
          "height": 1620
        },
        "pixel_dimensions": {
          "width": 3840,
          "height": 6480
        },
        "raster_scale": 1
      }
    },
    {
      "id": "lisa-order-not-accepted",
      "order": 9,
      "display_order": 9,
      "source_id": "owner_approved_candidate",
      "caption": "Данные для формирования презентации не приняты",
      "presentation": "phone",
      "scrollable": true,
      "action_ids": [],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 3075
      },
      "logical_dimensions": {
        "width": 521,
        "height": 3290
      },
      "cta_rect": null,
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-order-not-accepted-system-top.png",
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
            "width": 393,
            "height": 53
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 1
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-order-not-accepted-scroll-content.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 3075
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
            "width": 393,
            "height": 3075
          },
          "logical_dimensions": {
            "width": 393,
            "height": 3075
          },
          "raster_scale": 1
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-order-not-accepted-system-bottom.png",
          "source_rect": {
            "x": 64,
            "y": 3176,
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
            "width": 393,
            "height": 34
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 1
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-order-not-accepted-system-top.png",
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
              "width": 393,
              "height": 53
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 1
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-order-not-accepted-scroll-content.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 3075
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
              "width": 393,
              "height": 3075
            },
            "logical_dimensions": {
              "width": 393,
              "height": 3075
            },
            "raster_scale": 1
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-order-not-accepted-system-bottom.png",
            "source_rect": {
              "x": 64,
              "y": 3176,
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
              "width": 393,
              "height": 34
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 1
          }
        ]
      }
    },
    {
      "id": "lisa-delivery-delayed",
      "order": 10,
      "display_order": 10,
      "source_id": "owner_approved_candidate",
      "caption": "Отправка презентации задерживается",
      "presentation": "phone",
      "scrollable": true,
      "action_ids": [],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 3075
      },
      "logical_dimensions": {
        "width": 521,
        "height": 3290
      },
      "cta_rect": null,
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-delivery-delayed-system-top.png",
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
            "width": 393,
            "height": 53
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 1
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-delivery-delayed-scroll-content.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 3075
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
            "width": 393,
            "height": 3075
          },
          "logical_dimensions": {
            "width": 393,
            "height": 3075
          },
          "raster_scale": 1
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-delivery-delayed-system-bottom.png",
          "source_rect": {
            "x": 64,
            "y": 3176,
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
            "width": 393,
            "height": 34
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 1
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-delivery-delayed-system-top.png",
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
              "width": 393,
              "height": 53
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 1
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-delivery-delayed-scroll-content.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 3075
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
              "width": 393,
              "height": 3075
            },
            "logical_dimensions": {
              "width": 393,
              "height": 3075
            },
            "raster_scale": 1
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-delivery-delayed-system-bottom.png",
            "source_rect": {
              "x": 64,
              "y": 3176,
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
              "width": 393,
              "height": 34
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 1
          }
        ]
      }
    },
    {
      "id": "lisa-delivery-partial",
      "order": 11,
      "display_order": 11,
      "source_id": "owner_approved_candidate",
      "caption": "Частичная или неподтверждённая доставка презентации",
      "presentation": "phone",
      "scrollable": true,
      "action_ids": [],
      "viewport": {
        "width": 393,
        "height": 852
      },
      "content": {
        "width": 393,
        "height": 3075
      },
      "logical_dimensions": {
        "width": 521,
        "height": 3290
      },
      "cta_rect": null,
      "raster_layers": [
        {
          "role": "system_top",
          "src": "assets/lisa-delivery-partial-system-top.png",
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
            "width": 393,
            "height": 53
          },
          "logical_dimensions": {
            "width": 393,
            "height": 53
          },
          "raster_scale": 1
        },
        {
          "role": "scroll_content",
          "src": "assets/lisa-delivery-partial-scroll-content.png",
          "source_rect": {
            "x": 64,
            "y": 101,
            "width": 393,
            "height": 3075
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
            "width": 393,
            "height": 3075
          },
          "logical_dimensions": {
            "width": 393,
            "height": 3075
          },
          "raster_scale": 1
        },
        {
          "role": "system_bottom",
          "src": "assets/lisa-delivery-partial-system-bottom.png",
          "source_rect": {
            "x": 64,
            "y": 3176,
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
            "width": 393,
            "height": 34
          },
          "logical_dimensions": {
            "width": 393,
            "height": 34
          },
          "raster_scale": 1
        }
      ],
      "asset": {
        "layers": [
          {
            "role": "system_top",
            "src": "assets/lisa-delivery-partial-system-top.png",
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
              "width": 393,
              "height": 53
            },
            "logical_dimensions": {
              "width": 393,
              "height": 53
            },
            "raster_scale": 1
          },
          {
            "role": "scroll_content",
            "src": "assets/lisa-delivery-partial-scroll-content.png",
            "source_rect": {
              "x": 64,
              "y": 101,
              "width": 393,
              "height": 3075
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
              "width": 393,
              "height": 3075
            },
            "logical_dimensions": {
              "width": 393,
              "height": 3075
            },
            "raster_scale": 1
          },
          {
            "role": "system_bottom",
            "src": "assets/lisa-delivery-partial-system-bottom.png",
            "source_rect": {
              "x": 64,
              "y": 3176,
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
              "width": 393,
              "height": 34
            },
            "logical_dimensions": {
              "width": 393,
              "height": 34
            },
            "raster_scale": 1
          }
        ]
      }
    }
  ]
});
