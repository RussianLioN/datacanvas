window.LISA_PROTOTYPE_DATA = Object.freeze({
  "version": "3.0.0",
  "initial_state_id": "lisa-materials-summary",
  "order_target_state_id": "lisa-presentation-generating",
  "lifecycle": {
    "model": "variant",
    "content_review_status": "approved_product_owner",
    "visual_release_status": "approved_product_owner",
    "states": [
      {
        "id": "eligible",
        "next_state_ids": [
          "validating"
        ]
      },
      {
        "id": "validating",
        "next_state_ids": [
          "rejected_retryable",
          "accepted_locked"
        ]
      },
      {
        "id": "rejected_retryable",
        "next_state_ids": [
          "validating"
        ]
      },
      {
        "id": "accepted_locked",
        "next_state_ids": [
          "generating"
        ]
      },
      {
        "id": "generating",
        "next_state_ids": [
          "delivery_confirmed",
          "delayed",
          "delivery_partial"
        ]
      },
      {
        "id": "delivery_confirmed",
        "next_state_ids": [
          "session_closed"
        ]
      },
      {
        "id": "delayed",
        "next_state_ids": [
          "support_pending"
        ]
      },
      {
        "id": "delivery_partial",
        "next_state_ids": [
          "support_pending"
        ]
      },
      {
        "id": "support_pending",
        "next_state_ids": [
          "session_closed"
        ]
      },
      {
        "id": "session_closed",
        "next_state_ids": []
      }
    ],
    "button": {
      "source_state_ids": [
        "lisa-materials-summary",
        "lisa-materials-full-reference",
        "lisa-presentation-order"
      ],
      "enabled_in": [
        "eligible",
        "rejected_retryable"
      ],
      "disabled_in": [
        "validating",
        "accepted_locked",
        "generating",
        "delivery_confirmed",
        "delayed",
        "delivery_partial",
        "support_pending",
        "session_closed"
      ],
      "submission": "immediate_without_confirmation",
      "retry_after": "rejected_retryable"
    },
    "single_order_lock": {
      "scope": "session_user_pair",
      "locks_on": "accepted_locked",
      "duplicate_behavior": "reject_after_acceptance"
    },
    "chat": {
      "delivery": "same_chat_on_return",
      "persistence": true,
      "system_push": false,
      "safe_message_only": true
    },
    "scope": {
      "result_link": false,
      "separate_storage": false,
      "rich_structure_editing": false
    },
    "delivery_variants": [
      {
        "id": "one_contour",
        "contour_count": 1
      },
      {
        "id": "two_contours",
        "contour_count": 2
      }
    ],
    "screen_sequence": {
      "decision_id": "CO3-DEC-009",
      "preserve_existing_source_order": true,
      "existing_state_ids": [
        "lisa-materials-summary",
        "lisa-materials-full-reference",
        "lisa-presentation-order",
        "lisa-presentation-generating",
        "lisa-presentation-chat-list",
        "lisa-presentation-sent",
        "lisa-presentation-email",
        "lisa-presentation-slidedoc",
        "lisa-presentation-sber2025",
        "lisa-presentation-mag"
      ],
      "additional_status_state_ids": [
        "lisa-order-not-accepted",
        "lisa-delivery-delayed",
        "lisa-delivery-partial"
      ],
      "status_presentations": [
        {
          "state_id": "lisa-order-not-accepted",
          "base_state_id": "lisa-presentation-generating",
          "source_id": "status-order-not-accepted",
          "lifecycle_message_id": "order_not_accepted",
          "prototype_preview_text": "Не удалось принять данные для формирования презентации. Вернитесь к диалогу «Справка по клиенту» и уточните данные, либо оформите тикет в сопровождение.",
          "caption": "Данные для формирования презентации не приняты"
        },
        {
          "state_id": "lisa-delivery-delayed",
          "base_state_id": "lisa-presentation-generating",
          "source_id": "status-delivery-delayed",
          "lifecycle_message_id": "delivery_delayed",
          "prototype_preview_text": "Презентация формируется дольше 20 минут. Задача передана в сопровождение; сообщу здесь, если отправка на почту будет подтверждена.",
          "caption": "Отправка презентации задерживается"
        },
        {
          "state_id": "lisa-delivery-partial",
          "base_state_id": "lisa-presentation-generating",
          "source_id": "status-delivery-partial",
          "lifecycle_message_id": "delivery_partial",
          "prototype_preview_text": "Презентация сформирована и направлена в OMEGA. Отправка в SIGMA пока не подтверждена. Задача передана в сопровождение; сообщу здесь, если отправка будет подтверждена.",
          "caption": "Частичная или неподтверждённая доставка презентации"
        }
      ],
      "additional_status_placement": "after_existing_presentation_states",
      "delivery_failure_presentation": {
        "decision_id": "CO3-DEC-009",
        "presentation_state_id": "lisa-delivery-partial",
        "lifecycle_message_id": "delivery_partial",
        "separate_screen": false
      },
      "generation_status": "visual_generation_completed"
    },
    "messages": [
      {
        "id": "order_started",
        "decision_id": "CO3-DEC-007",
        "message_id": "CO3-MSG-001",
        "authoritative_text_status": "agreed",
        "authoritative_text": "Начал формировать презентацию в ЧЧ:ММ. Это займет не более 20 минут. Можете переключиться на другие задачи и через 20 минут проверить почту OMEGA и SIGMA: туда будет направлена презентация"
      },
      {
        "id": "order_not_accepted",
        "decision_id": "CO3-DEC-007",
        "message_id": "CO3-MSG-002",
        "authoritative_text_status": "agreed",
        "authoritative_text": "Не удалось принять данные для формирования презентации. Вернитесь к диалогу «Справка по клиенту» и уточните данные, либо оформите тикет в сопровождение."
      },
      {
        "id": "delivery_confirmed",
        "decision_id": "CO3-DEC-007",
        "message_id": "CO3-MSG-003",
        "authoritative_text_status": "agreed",
        "authoritative_text": "Презентация сформирована и отправлена на почту в ЧЧ:ММ, проверьте почтовый ящик!"
      },
      {
        "id": "delivery_delayed",
        "decision_id": "CO3-DEC-007",
        "message_id": "CO3-MSG-004",
        "authoritative_text_status": "agreed",
        "authoritative_text": "Презентация формируется дольше 20 минут. Задача передана в сопровождение; сообщу здесь, если отправка на почту будет подтверждена."
      },
      {
        "id": "delivery_partial",
        "decision_id": "CO3-DEC-007",
        "message_id": "CO3-MSG-005",
        "authoritative_text_status": "agreed",
        "authoritative_text": "Презентация сформирована и направлена в {КОНТУР_УСПЕШНОЙ_ОТПРАВКИ}. Отправка в {КОНТУР_НЕПОДТВЕРЖДЁННОЙ_ОТПРАВКИ} пока не подтверждена. Задача передана в сопровождение; сообщу здесь, если отправка будет подтверждена.",
        "contour_display_rule": "by_actual_address_lookup"
      }
    ]
  },
  "navigation": {
    "display_total": 14
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
    },
    {
      "id": "lisa-order-not-accepted",
      "order": 11,
      "display_order": 12,
      "source_id": "status-order-not-accepted",
      "caption": "Данные для формирования презентации не приняты",
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
          "src": "assets/lisa-order-not-accepted-status-3x.png",
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
          "src": "assets/lisa-order-not-accepted-content-3x.png",
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
          "src": "assets/lisa-order-not-accepted-home-3x.png",
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
            "src": "assets/lisa-order-not-accepted-status-3x.png",
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
            "src": "assets/lisa-order-not-accepted-content-3x.png",
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
            "src": "assets/lisa-order-not-accepted-home-3x.png",
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
      "id": "lisa-delivery-delayed",
      "order": 12,
      "display_order": 13,
      "source_id": "status-delivery-delayed",
      "caption": "Отправка презентации задерживается",
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
          "src": "assets/lisa-delivery-delayed-status-3x.png",
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
          "src": "assets/lisa-delivery-delayed-content-3x.png",
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
          "src": "assets/lisa-delivery-delayed-home-3x.png",
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
            "src": "assets/lisa-delivery-delayed-status-3x.png",
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
            "src": "assets/lisa-delivery-delayed-content-3x.png",
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
            "src": "assets/lisa-delivery-delayed-home-3x.png",
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
      "id": "lisa-delivery-partial",
      "order": 13,
      "display_order": 14,
      "source_id": "status-delivery-partial",
      "caption": "Частичная или неподтверждённая доставка презентации",
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
          "src": "assets/lisa-delivery-partial-status-3x.png",
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
          "src": "assets/lisa-delivery-partial-content-3x.png",
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
          "src": "assets/lisa-delivery-partial-home-3x.png",
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
            "src": "assets/lisa-delivery-partial-status-3x.png",
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
            "src": "assets/lisa-delivery-partial-content-3x.png",
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
            "src": "assets/lisa-delivery-partial-home-3x.png",
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
