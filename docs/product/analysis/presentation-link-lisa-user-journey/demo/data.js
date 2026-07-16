window.LISA_PROTOTYPE_DATA = {
  "version": "1.2.0",
  "status": "owner-approved-prototype",
  "initial_state_id": "lisa-materials-ready",
  "route": {
    "surface": "lisa",
    "interaction_mode": "lisa_dialog",
    "datacanvas_launch_mode": "other_agent",
    "initiator": "user_action"
  },
  "result_ref": "secure-pdf-copy-001",
  "notification": {
    "kind": "lisa_notification_center_item",
    "push_supported": false,
    "unread_indicator": "red_dot_on_bell",
    "list_open_marks_read": false,
    "result_open_marks_read": true,
    "minimum_visible_data": [
      "Презентация готова",
      "Время готовности",
      "Действие открытия"
    ],
    "forbidden_visible_data": [
      "Полный адрес защищённой ссылки",
      "Название клиента",
      "Содержание презентации"
    ]
  },
  "email_delivery": {
    "prototype_only_deviation": true,
    "recipient_copy": "ваша рабочая почта",
    "recipient_rule_confirmed": false,
    "message_count": 1,
    "required_attachments": [
      "pdf",
      "pptx"
    ],
    "success_requires_all_attachments": true,
    "retry_scope": "failed_attachment_only",
    "success_semantics": "accepted_by_mail_transport",
    "revoked_link_does_not_revoke_attachments": true,
    "entry_surfaces": [
      "chat-ready-card",
      "viewer-from-chat",
      "viewer-from-notification"
    ]
  },
  "prototype_semantics": {
    "scope": "visual-validation-only",
    "fields": [
      "prototype_timeline",
      "notification.kind",
      "notification.list_open_marks_read",
      "notification.result_open_marks_read",
      "notification.minimum_visible_data",
      "email_delivery.recipient_copy",
      "email_delivery.message_count",
      "email_delivery.retry_scope",
      "email_delivery.revoked_link_does_not_revoke_attachments",
      "invariants.one-order-per-material-version",
      "invariants.one-ready-event-two-projections",
      "invariants.duplicate-ready-events-do-not-create-duplicates"
    ]
  },
  "open_product_decisions": [
    "Срок жизни ссылки",
    "Правила выдачи и отзыва доступа",
    "Допустимая задержка между двумя проекциями события готовности",
    "Порядок появления карточки чата и записи центра уведомлений",
    "Промышленная идемпотентность и ключ устранения дублей",
    "Поведение на нескольких устройствах",
    "Повторная доставка после отказа отдельной поверхности",
    "Точные правила работы без сети",
    "Целевая поверхность открытия результата",
    "Допустимый состав данных уведомления",
    "Правила определения получателя и адреса электронной почты",
    "Число почтовых сообщений и правила повторной отправки вложений",
    "Связь отзыва защищённой ссылки с ранее отправленными файлами",
    "Точное разделение ответственности смежных команд",
    "Числовое соглашение о времени готовности"
  ],
  "prototype_timeline": {
    "start_time": "13:24",
    "ready_time": "13:44",
    "generation_started_at_ms": 600,
    "clock_animation_ends_at_ms": 7600,
    "ready_at_ms": 8000,
    "direct_state_autoplay": false
  },
  "presentation": {
    "$schema": "schemas/presentation-preview-contract.schema.json",
    "version": "1.0.0",
    "status": "owner-approved-prototype",
    "audience": "internal-client-manager-and-leader",
    "communication_job": "Показать состояние отношений с клиентом, основные угрозы и возможности, а также три решения, к которым должна привести встреча.",
    "aspect_ratio": "16:9",
    "slides": [
      {
        "id": "relationship-scale",
        "title": "Активы задают масштаб отношений, но остальные направления заметно уступают",
        "short_title": "Масштаб отношений",
        "layout": "hero-metrics",
        "data_bindings": [
          "sections.cooperation.blocks.metrics.items.assets.value",
          "sections.cooperation.blocks.top-three.items.assets",
          "sections.cooperation.blocks.metrics.items.liabilities.value",
          "sections.cooperation.blocks.metrics.items.non-credit-income.value",
          "sections.cooperation.blocks.metrics.items.payroll.value",
          "sections.cooperation.blocks.metrics.items.ecosystem.value"
        ]
      },
      {
        "id": "opportunities-and-pressure",
        "title": "Главные возможности сосредоточены в гарантии и краткосрочном финансировании, а давление — в эквайринге",
        "short_title": "Возможности и давление",
        "layout": "offers-and-comparison",
        "data_bindings": [
          "sections.preapproved-offers.blocks.offers.items.customs-guarantee",
          "sections.preapproved-offers.blocks.offers.items.short-financing",
          "sections.preapproved-offers.blocks.offers.items.leasing",
          "sections.agenda.blocks.agenda-items.items.a1",
          "sections.agenda.blocks.agenda-items.items.a6"
        ]
      },
      {
        "id": "meeting-decisions",
        "title": "Встреча должна завершиться следующими шагами по эквайрингу, поставкам из Индии и новым площадям",
        "short_title": "Решения встречи",
        "layout": "decision-path",
        "data_bindings": [
          "sections.agenda.blocks.agenda-items.items.a1",
          "sections.agenda.blocks.agenda-items.items.a2",
          "sections.agenda.blocks.agenda-items.items.a3"
        ],
        "card_summaries": [
          {
            "binding": "sections.agenda.blocks.agenda-items.items.a1",
            "text": "Обсудить возможность пересмотра тарифа и удержание эквайринга."
          },
          {
            "binding": "sections.agenda.blocks.agenda-items.items.a2",
            "text": "Передать итоги переговоров по тарифу 0,25% и альтернативным поставщикам."
          },
          {
            "binding": "sections.agenda.blocks.agenda-items.items.a3",
            "text": "Уточнить планы по объекту 2,4 га и потребность в кредитовании."
          }
        ]
      }
    ]
  },
  "source_fixture": {
    "$schema": "schemas/source-fixture-manifest.schema.json",
    "version": "1.0.0",
    "source_file": "lisa-prototype_7.html",
    "source_sha256": "d60267513a5d2081bcc5d9fb74305e8b7c4fa4edf82653423456537d809cd5ad",
    "normalized_material_sha256": "7676d6df83ce1df90d390f0e80741a480e586bb18da8593cebbf458986c2c3da",
    "data_classification": "synthetic",
    "owner_permission": "owner-approved-use-2026-07-16",
    "trust": "untrusted-data-only",
    "copied_executable_code": false,
    "active_external_links": false,
    "external_source_occurrences": 5,
    "external_source_count": 4
  },
  "layout": {
    "phone_max_width_px": 375,
    "phone_max_height_px": 812,
    "action_two_column_min_content_width_px": 356,
    "minimum_target_px": 44,
    "minimum_action_gap_px": 8,
    "button_min_height_px": 54,
    "whole_phone_transform_scale_allowed": false,
    "vertical_scroll_regions": [
      "chat",
      "notifications-list"
    ],
    "horizontal_scroll_regions": [],
    "desktop_shell_breakpoint_px": 1080,
    "horizontal_overflow_tolerance_px": 1,
    "intersection_tolerance_square_px": 1
  },
  "viewer": {
    "slide_count": 3,
    "aspect_ratio": "16:9",
    "minimum_scale": 1,
    "maximum_scale": 3,
    "double_tap_scale": 2,
    "reset_transform_on_slide_change": true,
    "reset_transform_on_open": true,
    "fixed_toolbar": true,
    "fixed_actions": true
  },
  "motion": {
    "clock_overlay": {
      "start_time": "13:24",
      "end_time": "13:44",
      "starts_at_ms": 600,
      "ends_at_ms": 7600,
      "ready_at_ms": 8000,
      "pointer_events": "none",
      "reduced_motion_rotation": false
    }
  },
  "accessibility": {
    "standard": "WCAG 2.1 AA",
    "axe_tags": [
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa"
    ],
    "notification_dot_aria_hidden": true,
    "bell_accessible_name_unread": "Уведомления, одно новое",
    "bell_accessible_name_read": "Уведомления",
    "async_ready_live_region": "polite",
    "dialog_escape_closes": true,
    "dialog_focus_trap": true,
    "viewer_close_restores_focus": true,
    "viewer_close_restores_scroll": true,
    "minimum_text_contrast_ratio": 4.5,
    "minimum_large_text_contrast_ratio": 3
  },
  "tokens": {
    "colors": {
      "canvas": "#F2F1F7",
      "phone": "#FBFAFD",
      "surface": "#FFFFFF",
      "surface_soft": "#F8F7FA",
      "text": "#1B1B23",
      "text_muted": "#65616D",
      "border": "#E5E1E9",
      "accent": "#FF8A3D",
      "accent_end": "#FF5F9E",
      "accent_lilac": "#C76BD6",
      "accent_dark": "#1B1B23",
      "accent_soft": "#FFEDE0",
      "glow_peach": "#FFD9B8",
      "glow_lilac": "#E6D9FB",
      "success": "#287A58",
      "warning": "#9A5B16",
      "error": "#A93A4A",
      "notification": "#D9253A",
      "focus": "#135FB8"
    },
    "radii_px": {
      "phone": 48,
      "card": 22,
      "button": 18,
      "pill": 999
    },
    "spacing_px": [
      4,
      8,
      12,
      16,
      20,
      24,
      32
    ],
    "font": {
      "family": "Noto Sans",
      "body_px": 16,
      "secondary_px": 14,
      "title_px": 22,
      "button_px": 16,
      "body_weight": 400,
      "strong_weight": 700
    }
  },
  "visual_components": [
    {
      "id": "lisa-phone-shell",
      "source_svg": "components/lisa-phone-shell.svg",
      "role": "presentation",
      "usage": "rendered-in-html"
    },
    {
      "id": "lisa-notification-bell",
      "source_svg": "components/lisa-notification-bell.svg",
      "role": "img",
      "usage": "rendered-in-html"
    },
    {
      "id": "lisa-presentation-card",
      "source_svg": "components/lisa-presentation-card.svg",
      "role": "img",
      "usage": "reference-only"
    }
  ],
  "states": [
    {
      "id": "lisa-materials-ready",
      "kind": "chat",
      "display_name": "Итоговые материалы — действия",
      "title": "Материалы к встрече готовы",
      "eyebrow": "Подготовка к встрече",
      "body": "Итоговые материалы собраны по текущей встрече.",
      "detail_lines": [],
      "content": {
        "type": "meeting-material",
        "data_classification": "synthetic",
        "external_links_allowed": false,
        "initial_scroll_anchor": "material-start",
        "action_anchor": "material-actions",
        "header": {
          "title": "Подготовка к встрече",
          "holding": "Холдинг ГК Достовалова",
          "company": "ИП Достовалова",
          "meta": "Регулярная встреча · материалы актуальны на 11 июля 2026"
        },
        "sections": [
          {
            "id": "participants",
            "title": "Участники встречи",
            "blocks": [
              {
                "id": "meeting-participants",
                "type": "participants",
                "items": [
                  {
                    "id": "p1",
                    "name": "Достовалова Ирина Антоновна",
                    "role": "Бенефициар"
                  },
                  {
                    "id": "p2",
                    "name": "Савёлов Антон Игоревич",
                    "role": "Генеральный директор"
                  }
                ]
              }
            ]
          },
          {
            "id": "agenda",
            "title": "Повестка встречи",
            "blocks": [
              {
                "id": "agenda-items",
                "type": "agenda",
                "items": [
                  {
                    "id": "a1",
                    "title": "Эквайринг",
                    "description": "Клиент сообщил о конкуренции с ВТБ — конкурент предлагает ставку 1,5% против текущих условий Сбера (1,7–1,8%). Есть риск оттока по этому продукту. Стоит обсудить возможность пересмотра тарифа, чтобы удержать клиента.",
                    "tag": "insight",
                    "group": "mandatory",
                    "numeric_facts": {
                      "competitor_rate_percent": 1.5,
                      "sber_rate_percent_min": 1.7,
                      "sber_rate_percent_max": 1.8
                    }
                  },
                  {
                    "id": "a2",
                    "title": "Поставки из Индии",
                    "description": "На предыдущей встрече клиент запросил пересмотр условий работы с индийским подрядчиком. Нужно предоставить итоги переговоров — обсуждается тариф 0,25% для любых сумм платежей, а также возможность поиска альтернативных поставщиков по сниженной цене.",
                    "tag": "agreement",
                    "group": "mandatory",
                    "numeric_facts": {
                      "tariff_percent": 0.25
                    }
                  },
                  {
                    "id": "a3",
                    "title": "Новые площади в Красноярске",
                    "description": "Клиент приобрёл имущество обанкротившейся компании АО «Сельэлектрострой» в Красноярске — здания, гаражи, склады и земельные участки общей площадью 2,4 гектара. Стоит уточнить планы по застройке нового объекта и потребность в кредитовании.",
                    "tag": "news",
                    "group": "mandatory",
                    "source_label": "Подробности сделки",
                    "numeric_facts": {
                      "area_hectares": 2.4
                    }
                  },
                  {
                    "id": "a4",
                    "title": "СберСпасибо",
                    "description": "На предыдущей встрече обсуждались технические особенности подключения к программе лояльности. Клиент ждёт обратной связи от команды СберСпасибо о дальнейших шагах интеграции кассового ПО.",
                    "tag": "agreement",
                    "group": "optional"
                  },
                  {
                    "id": "a5",
                    "title": "BNPL",
                    "description": "Клиент заинтересовался продуктом BNPL, но действующая ставка 4,5% видится ему высокой. Стоит подготовить аргументы в пользу продукта и проверить возможность более выгодных условий или альтернативного коммерческого предложения.",
                    "tag": "insight",
                    "group": "optional",
                    "numeric_facts": {
                      "rate_percent": 4.5
                    }
                  },
                  {
                    "id": "a6",
                    "title": "КСО",
                    "description": "На предыдущей встрече проговорили необходимость диалога с ДЗО в рамках старта сотрудничества по кассовому оборудованию. Важно учитывать, что Альфа-Банк предлагает бесплатные КСО с абонентской платой 5 000 ₽/мес — это выглядит для клиента привлекательнее текущих условий Сбера.",
                    "tag": "insight",
                    "group": "optional",
                    "numeric_facts": {
                      "subscription_rub_per_month": 5000
                    }
                  }
                ]
              }
            ]
          },
          {
            "id": "cooperation",
            "title": "Сотрудничество",
            "blocks": [
              {
                "id": "products-overview",
                "type": "paragraph",
                "text": "Основные продукты: активы (кредитный портфель), НКД (эквайринг, инкассация), пассивы (овернайт), ФОТ, экосистема."
              },
              {
                "id": "top-three",
                "type": "bullet-list",
                "label": "ТОП-3 по ЧОД",
                "items": [
                  {
                    "id": "assets",
                    "text": "Активы — остаток 1 250 млн ₽, доля Сбера 83%"
                  },
                  {
                    "id": "non-credit-income",
                    "text": "НКД — 15 млн ₽, сформирован за счёт эквайринга и инкассации"
                  },
                  {
                    "id": "liabilities",
                    "text": "Пассивы — 115 млн ₽, большей частью за счёт овернайта"
                  }
                ]
              },
              {
                "id": "metrics",
                "type": "metrics",
                "label": "Условия по текущим якорным продуктам",
                "items": [
                  {
                    "id": "assets",
                    "label": "Активы",
                    "value": "1 250 млн ₽",
                    "amount_mln_rub": 1250,
                    "sber_share_percent": 83
                  },
                  {
                    "id": "liabilities",
                    "label": "Пассивы",
                    "value": "115 млн ₽ — овернайт",
                    "amount_mln_rub": 115
                  },
                  {
                    "id": "non-credit-income",
                    "label": "НКД",
                    "value": "15 млн ₽ — эквайринг и инкассация",
                    "amount_mln_rub": 15
                  },
                  {
                    "id": "payroll",
                    "label": "ФОТ",
                    "value": "14 млн ₽ — снижение за 3 мес.",
                    "amount_mln_rub": 14
                  },
                  {
                    "id": "ecosystem",
                    "label": "Экосистема",
                    "value": "8 млн ₽ — СберЗдоровье, СберМаркетинг",
                    "amount_mln_rub": 8
                  }
                ]
              }
            ]
          },
          {
            "id": "preapproved-offers",
            "title": "Предодобренные предложения",
            "blocks": [
              {
                "id": "offers",
                "type": "offers",
                "items": [
                  {
                    "id": "customs-guarantee",
                    "title": "Банковская гарантия (таможенная)",
                    "amount": "19 млрд ₽",
                    "maximum_term": "14 мес.",
                    "limit_bln_rub": 19,
                    "max_term_months": 14
                  },
                  {
                    "id": "short-financing",
                    "title": "Краткосрочное финансирование",
                    "amount": "16 млрд ₽",
                    "maximum_term": "36 мес.",
                    "warning": "Отклонение: нет БО по клиенту",
                    "limit_bln_rub": 16,
                    "max_term_months": 36
                  },
                  {
                    "id": "leasing",
                    "title": "Лизинг СБЛ",
                    "amount": "2 млрд ₽",
                    "maximum_term": "84 мес.",
                    "limit_bln_rub": 2,
                    "max_term_months": 84
                  }
                ]
              },
              {
                "id": "risk-status",
                "type": "callout",
                "tone": "success",
                "text": "Риски отсутствуют — компании холдинга не в стадии ликвидации, стоп-лист не применяется"
              }
            ]
          },
          {
            "id": "past-agreements",
            "title": "Договорённости с прошлой встречи",
            "blocks": [
              {
                "id": "agreements",
                "type": "bullet-list",
                "items": [
                  {
                    "id": "india-suppliers",
                    "text": "Поиск альтернативных поставщиков оборудования из Индии по сниженной цене"
                  },
                  {
                    "id": "kso-consultation",
                    "text": "Консультация технических специалистов по внедрению КСО"
                  },
                  {
                    "id": "currency-hedging",
                    "text": "Предоставление информации и поддержки по валютному хеджированию"
                  },
                  {
                    "id": "frp-credit",
                    "text": "Получение ясности по срокам кредита от ФРП"
                  }
                ]
              }
            ]
          },
          {
            "id": "competitor-risks",
            "title": "Риски и инсайты о других банках",
            "blocks": [
              {
                "id": "risks",
                "type": "bullet-list",
                "items": [
                  {
                    "id": "alfa-acquiring",
                    "text": "Альфа-Банк — эквайринг 1,5% (у Сбера 1,7%) + бесплатные КСО с абонплатой 5 000 ₽"
                  },
                  {
                    "id": "vtb-acquiring",
                    "text": "ВТБ — предложили эквайринг 1,7% без НДС"
                  },
                  {
                    "id": "payroll-and-foreign-trade",
                    "text": "Открытие, ВТБ — уже занимают часть ФОТ и ВЭД"
                  },
                  {
                    "id": "salary-project-perception",
                    "text": "Клиент называет зарплатный проект Сбера «скучным и невыгодным»"
                  }
                ]
              }
            ]
          },
          {
            "id": "dialog-starters",
            "title": "С чего начать диалог",
            "blocks": [
              {
                "id": "small-talk",
                "type": "sourced-list",
                "label": "Темы для смолл-толка",
                "items": [
                  {
                    "id": "market-transformation",
                    "text": "Трансформация спроса в сегменте сантехники и отделочных материалов в 2026 году — смещение от премиум-импорта к локальным брендам и «тихим» параллельным поставкам.",
                    "source_label": "Аналитика рынка"
                  },
                  {
                    "id": "retail-automation",
                    "text": "Кадровый голод в рознице и стройке — переход к автоматизации складов, чат-ботам и CRM вместо расширения штата продавцов.",
                    "source_label": "Подробнее"
                  },
                  {
                    "id": "property-yield",
                    "text": "Сравнение доходности: долгосрочная аренда действующих коммерческих площадей vs перепродажа объектов после разделения на лоты.",
                    "source_label": "Кейс"
                  }
                ]
              },
              {
                "id": "company-news",
                "type": "sourced-list",
                "label": "Новости о компании",
                "items": [
                  {
                    "id": "kalinina-property",
                    "text": "Хозяйка сети «Водолей», одна из богатейших женщин Красноярска — купила два гектара земли и офисы на Калинина за 260 млн ₽.",
                    "source_label": "Читать новость"
                  }
                ]
              }
            ]
          }
        ]
      },
      "action_ids": [
        "edit-materials",
        "email-materials",
        "order-presentation"
      ],
      "actions": [
        {
          "id": "edit-materials",
          "label": "Редактировать",
          "accessible_label": "Редактировать материалы к встрече",
          "variant": "secondary",
          "behavior": "open-materials-dialog"
        },
        {
          "id": "email-materials",
          "label": "Отправить в почту",
          "accessible_label": "Отправить материалы к встрече на почту",
          "variant": "secondary",
          "target_state_id": "lisa-materials-email-sent"
        },
        {
          "id": "order-presentation",
          "label": "Заказать презентацию",
          "variant": "primary",
          "target_state_id": "lisa-presentation-order-submitting",
          "prototype_sequence": [
            {
              "state_id": "lisa-presentation-generating",
              "at_ms": 600
            },
            {
              "state_id": "lisa-presentation-ready-unread",
              "at_ms": 8000
            }
          ]
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-materials-ready",
        "display_name": "Итоговые материалы — действия",
        "kind": "chat",
        "texts": [
          "Подготовка к встрече",
          "Материалы к встрече готовы",
          "Итоговые материалы собраны по текущей встрече.",
          "synthetic",
          "material-start",
          "material-actions",
          "Подготовка к встрече",
          "Холдинг ГК Достовалова",
          "ИП Достовалова",
          "Регулярная встреча · материалы актуальны на 11 июля 2026",
          "Участники встречи",
          "Достовалова Ирина Антоновна",
          "Бенефициар",
          "Савёлов Антон Игоревич",
          "Генеральный директор",
          "Повестка встречи",
          "Эквайринг",
          "Клиент сообщил о конкуренции с ВТБ — конкурент предлагает ставку 1,5% против текущих условий Сбера (1,7–1,8%). Есть риск оттока по этому продукту. Стоит обсудить возможность пересмотра тарифа, чтобы удержать клиента.",
          "Поставки из Индии",
          "На предыдущей встрече клиент запросил пересмотр условий работы с индийским подрядчиком. Нужно предоставить итоги переговоров — обсуждается тариф 0,25% для любых сумм платежей, а также возможность поиска альтернативных поставщиков по сниженной цене.",
          "Новые площади в Красноярске",
          "Клиент приобрёл имущество обанкротившейся компании АО «Сельэлектрострой» в Красноярске — здания, гаражи, склады и земельные участки общей площадью 2,4 гектара. Стоит уточнить планы по застройке нового объекта и потребность в кредитовании.",
          "Подробности сделки",
          "СберСпасибо",
          "На предыдущей встрече обсуждались технические особенности подключения к программе лояльности. Клиент ждёт обратной связи от команды СберСпасибо о дальнейших шагах интеграции кассового ПО.",
          "BNPL",
          "Клиент заинтересовался продуктом BNPL, но действующая ставка 4,5% видится ему высокой. Стоит подготовить аргументы в пользу продукта и проверить возможность более выгодных условий или альтернативного коммерческого предложения.",
          "КСО",
          "На предыдущей встрече проговорили необходимость диалога с ДЗО в рамках старта сотрудничества по кассовому оборудованию. Важно учитывать, что Альфа-Банк предлагает бесплатные КСО с абонентской платой 5 000 ₽/мес — это выглядит для клиента привлекательнее текущих условий Сбера.",
          "Сотрудничество",
          "Основные продукты: активы (кредитный портфель), НКД (эквайринг, инкассация), пассивы (овернайт), ФОТ, экосистема.",
          "ТОП-3 по ЧОД",
          "Активы — остаток 1 250 млн ₽, доля Сбера 83%",
          "НКД — 15 млн ₽, сформирован за счёт эквайринга и инкассации",
          "Пассивы — 115 млн ₽, большей частью за счёт овернайта",
          "Условия по текущим якорным продуктам",
          "Активы",
          "1 250 млн ₽",
          "Пассивы",
          "115 млн ₽ — овернайт",
          "НКД",
          "15 млн ₽ — эквайринг и инкассация",
          "ФОТ",
          "14 млн ₽ — снижение за 3 мес.",
          "Экосистема",
          "8 млн ₽ — СберЗдоровье, СберМаркетинг",
          "Предодобренные предложения",
          "Банковская гарантия (таможенная)",
          "19 млрд ₽",
          "14 мес.",
          "Краткосрочное финансирование",
          "16 млрд ₽",
          "36 мес.",
          "Отклонение: нет БО по клиенту",
          "Лизинг СБЛ",
          "2 млрд ₽",
          "84 мес.",
          "success",
          "Риски отсутствуют — компании холдинга не в стадии ликвидации, стоп-лист не применяется",
          "Договорённости с прошлой встречи",
          "Поиск альтернативных поставщиков оборудования из Индии по сниженной цене",
          "Консультация технических специалистов по внедрению КСО",
          "Предоставление информации и поддержки по валютному хеджированию",
          "Получение ясности по срокам кредита от ФРП",
          "Риски и инсайты о других банках",
          "Альфа-Банк — эквайринг 1,5% (у Сбера 1,7%) + бесплатные КСО с абонплатой 5 000 ₽",
          "ВТБ — предложили эквайринг 1,7% без НДС",
          "Открытие, ВТБ — уже занимают часть ФОТ и ВЭД",
          "Клиент называет зарплатный проект Сбера «скучным и невыгодным»",
          "С чего начать диалог",
          "Темы для смолл-толка",
          "Трансформация спроса в сегменте сантехники и отделочных материалов в 2026 году — смещение от премиум-импорта к локальным брендам и «тихим» параллельным поставкам.",
          "Аналитика рынка",
          "Кадровый голод в рознице и стройке — переход к автоматизации складов, чат-ботам и CRM вместо расширения штата продавцов.",
          "Подробнее",
          "Сравнение доходности: долгосрочная аренда действующих коммерческих площадей vs перепродажа объектов после разделения на лоты.",
          "Кейс",
          "Новости о компании",
          "Хозяйка сети «Водолей», одна из богатейших женщин Красноярска — купила два гектара земли и офисы на Калинина за 260 млн ₽.",
          "Читать новость",
          "Редактировать",
          "Отправить в почту",
          "Заказать презентацию"
        ],
        "actions": [
          {
            "id": "edit-materials",
            "label": "Редактировать",
            "accessible_label": "Редактировать материалы к встрече",
            "variant": "secondary",
            "target_state_id": null,
            "behavior": "open-materials-dialog",
            "prototype_sequence": []
          },
          {
            "id": "email-materials",
            "label": "Отправить в почту",
            "accessible_label": "Отправить материалы к встрече на почту",
            "variant": "secondary",
            "target_state_id": "lisa-materials-email-sent",
            "behavior": null,
            "prototype_sequence": []
          },
          {
            "id": "order-presentation",
            "label": "Заказать презентацию",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-presentation-order-submitting",
            "behavior": null,
            "prototype_sequence": [
              {
                "state_id": "lisa-presentation-generating",
                "at_ms": 600
              },
              {
                "state_id": "lisa-presentation-ready-unread",
                "at_ms": 8000
              }
            ]
          }
        ],
        "result_ref": null,
        "history_state_ids": [],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "ed5b3e2b7f78a46b75dfba152c960f2ca334dbc63ce8688dc1fa450ce634ad53"
    },
    {
      "id": "lisa-materials-email-sent",
      "kind": "chat",
      "display_name": "Итоговые материалы — отправлены",
      "title": "Материалы отправлены",
      "eyebrow": "Подготовка к встрече",
      "body": "Материалы к встрече отправлены на вашу рабочую почту.",
      "detail_lines": [
        "Можно продолжить работу в чате или заказать презентацию по собранным материалам."
      ],
      "history_state_ids": [
        "lisa-materials-ready"
      ],
      "action_ids": [
        "order-presentation"
      ],
      "actions": [
        {
          "id": "order-presentation",
          "label": "Заказать презентацию",
          "variant": "primary",
          "target_state_id": "lisa-presentation-order-submitting",
          "prototype_sequence": [
            {
              "state_id": "lisa-presentation-generating",
              "at_ms": 600
            },
            {
              "state_id": "lisa-presentation-ready-unread",
              "at_ms": 8000
            }
          ]
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-materials-email-sent",
        "display_name": "Итоговые материалы — отправлены",
        "kind": "chat",
        "texts": [
          "Подготовка к встрече",
          "Материалы отправлены",
          "Материалы к встрече отправлены на вашу рабочую почту.",
          "Можно продолжить работу в чате или заказать презентацию по собранным материалам.",
          "Заказать презентацию"
        ],
        "actions": [
          {
            "id": "order-presentation",
            "label": "Заказать презентацию",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-presentation-order-submitting",
            "behavior": null,
            "prototype_sequence": [
              {
                "state_id": "lisa-presentation-generating",
                "at_ms": 600
              },
              {
                "state_id": "lisa-presentation-ready-unread",
                "at_ms": 8000
              }
            ]
          }
        ],
        "result_ref": null,
        "history_state_ids": [
          "lisa-materials-ready"
        ],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "6c9ba2a314b761c3116ad4f25e5bb4764f968ca47843b47d733625792b3ce925"
    },
    {
      "id": "lisa-presentation-order-submitting",
      "kind": "chat",
      "display_name": "Заказ презентации — передача",
      "title": "Передаём заказ",
      "eyebrow": "DataCanvas",
      "body": "Агент «Подготовка к встрече» передаёт в DataCanvas текущую версию материалов.",
      "detail_lines": [
        "Повторное нажатие не создаст ещё один заказ."
      ],
      "history_state_ids": [
        "lisa-materials-ready"
      ],
      "action_ids": [],
      "actions": [],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-presentation-order-submitting",
        "display_name": "Заказ презентации — передача",
        "kind": "chat",
        "texts": [
          "DataCanvas",
          "Передаём заказ",
          "Агент «Подготовка к встрече» передаёт в DataCanvas текущую версию материалов.",
          "Повторное нажатие не создаст ещё один заказ."
        ],
        "actions": [],
        "result_ref": null,
        "history_state_ids": [
          "lisa-materials-ready"
        ],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "94f2061ffd97f00c8c576a80fb14c79b4099f95fcf48ec80553420e51836bd6c"
    },
    {
      "id": "lisa-presentation-order-failed",
      "kind": "error",
      "display_name": "Заказ презентации — ошибка передачи",
      "title": "Заказ не передан",
      "eyebrow": "DataCanvas",
      "body": "Не удалось передать материалы для подготовки презентации.",
      "detail_lines": [
        "Новый заказ не создан. Повторите отправку, когда соединение восстановится."
      ],
      "history_state_ids": [
        "lisa-materials-ready"
      ],
      "action_ids": [
        "retry-order",
        "return-to-materials"
      ],
      "actions": [
        {
          "id": "retry-order",
          "label": "Повторить передачу",
          "variant": "primary",
          "target_state_id": "lisa-presentation-order-submitting",
          "prototype_sequence": [
            {
              "state_id": "lisa-presentation-generating",
              "at_ms": 600
            },
            {
              "state_id": "lisa-presentation-ready-unread",
              "at_ms": 8000
            }
          ]
        },
        {
          "id": "return-to-materials",
          "label": "Вернуться к материалам",
          "variant": "secondary",
          "target_state_id": "lisa-materials-ready"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-presentation-order-failed",
        "display_name": "Заказ презентации — ошибка передачи",
        "kind": "error",
        "texts": [
          "DataCanvas",
          "Заказ не передан",
          "Не удалось передать материалы для подготовки презентации.",
          "Новый заказ не создан. Повторите отправку, когда соединение восстановится.",
          "Повторить передачу",
          "Вернуться к материалам"
        ],
        "actions": [
          {
            "id": "retry-order",
            "label": "Повторить передачу",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-presentation-order-submitting",
            "behavior": null,
            "prototype_sequence": [
              {
                "state_id": "lisa-presentation-generating",
                "at_ms": 600
              },
              {
                "state_id": "lisa-presentation-ready-unread",
                "at_ms": 8000
              }
            ]
          },
          {
            "id": "return-to-materials",
            "label": "Вернуться к материалам",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-materials-ready",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": null,
        "history_state_ids": [
          "lisa-materials-ready"
        ],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "9ea9bc676cdaeb50d041e6129f7275a0de55ca66209fe88db53a4ead878a326f"
    },
    {
      "id": "lisa-presentation-generating",
      "kind": "chat",
      "display_name": "Заказ презентации — подготовка",
      "title": "Презентация готовится",
      "eyebrow": "DataCanvas",
      "body": "Мы начали подготовку презентации. Ожидаемое время готовности — 20 минут. По готовности здесь появится уведомление.",
      "detail_lines": [
        "Можно продолжить работу в текущем чате."
      ],
      "history_state_ids": [
        "lisa-materials-ready"
      ],
      "action_ids": [],
      "actions": [],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-presentation-generating",
        "display_name": "Заказ презентации — подготовка",
        "kind": "chat",
        "texts": [
          "DataCanvas",
          "Презентация готовится",
          "Мы начали подготовку презентации. Ожидаемое время готовности — 20 минут. По готовности здесь появится уведомление.",
          "Можно продолжить работу в текущем чате."
        ],
        "actions": [],
        "result_ref": null,
        "history_state_ids": [
          "lisa-materials-ready"
        ],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "12f3c6f83c0e2daa0e128aa323324b10f067fe73fc5db2a9f82e3358adc1e771"
    },
    {
      "id": "lisa-presentation-ready-unread",
      "kind": "chat-ready",
      "display_name": "Чат — презентация готова, не прочитано",
      "title": "Презентация готова",
      "eyebrow": "DataCanvas",
      "body": "Нередактируемая PDF-копия доступна в защищённом хранилище.",
      "detail_lines": [
        "Новая запись также появилась в уведомлениях Лисы."
      ],
      "history_state_ids": [
        "lisa-materials-ready",
        "lisa-presentation-generating"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": true,
      "action_ids": [
        "open-result-from-chat"
      ],
      "actions": [
        {
          "id": "open-result-from-chat",
          "label": "Открыть презентацию",
          "variant": "primary",
          "target_state_id": "lisa-result-view-from-chat"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-presentation-ready-unread",
        "display_name": "Чат — презентация готова, не прочитано",
        "kind": "chat-ready",
        "texts": [
          "DataCanvas",
          "Презентация готова",
          "Нередактируемая PDF-копия доступна в защищённом хранилище.",
          "Новая запись также появилась в уведомлениях Лисы.",
          "Открыть презентацию"
        ],
        "actions": [
          {
            "id": "open-result-from-chat",
            "label": "Открыть презентацию",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-result-view-from-chat",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [
          "lisa-materials-ready",
          "lisa-presentation-generating"
        ],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "737b19ee77409def6ec85854d79d5c1379af43c1c5e3b0b7947e804ca3f7bab5"
    },
    {
      "id": "lisa-notifications-list-empty",
      "kind": "notification-list",
      "display_name": "Уведомления — новых записей нет",
      "title": "Уведомления",
      "eyebrow": "Лиса",
      "body": "Новых уведомлений пока нет.",
      "detail_lines": [],
      "notification_unread": false,
      "action_ids": [
        "close-notifications-empty"
      ],
      "actions": [
        {
          "id": "close-notifications-empty",
          "label": "Закрыть уведомления",
          "variant": "secondary",
          "target_state_id": "lisa-materials-ready"
        }
      ],
      "region_id": "notifications-list",
      "projection": {
        "state_id": "lisa-notifications-list-empty",
        "display_name": "Уведомления — новых записей нет",
        "kind": "notification-list",
        "texts": [
          "Лиса",
          "Уведомления",
          "Новых уведомлений пока нет.",
          "Закрыть уведомления"
        ],
        "actions": [
          {
            "id": "close-notifications-empty",
            "label": "Закрыть уведомления",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-materials-ready",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": null,
        "history_state_ids": [],
        "region_id": "notifications-list",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "ad019ce45392c1eafb29c04bb23aa0389292087a20ac1c5fac6d52015eecfa8d"
    },
    {
      "id": "lisa-notifications-list-unread",
      "kind": "notification-list",
      "display_name": "Уведомления — есть новое",
      "title": "Уведомления",
      "eyebrow": "Лиса",
      "body": "Одно новое уведомление",
      "detail_lines": [
        "Презентация готова",
        "Сегодня, 13:44"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": true,
      "action_ids": [
        "open-notification-unread",
        "close-notifications-unread"
      ],
      "actions": [
        {
          "id": "open-notification-unread",
          "label": "Открыть уведомление",
          "variant": "primary",
          "target_state_id": "lisa-notification-detail-unread"
        },
        {
          "id": "close-notifications-unread",
          "label": "Закрыть уведомления",
          "variant": "secondary",
          "target_state_id": "lisa-presentation-ready-unread"
        }
      ],
      "region_id": "notifications-list",
      "projection": {
        "state_id": "lisa-notifications-list-unread",
        "display_name": "Уведомления — есть новое",
        "kind": "notification-list",
        "texts": [
          "Лиса",
          "Уведомления",
          "Одно новое уведомление",
          "Презентация готова",
          "Сегодня, 13:44",
          "Открыть уведомление",
          "Закрыть уведомления"
        ],
        "actions": [
          {
            "id": "open-notification-unread",
            "label": "Открыть уведомление",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-notification-detail-unread",
            "behavior": null,
            "prototype_sequence": []
          },
          {
            "id": "close-notifications-unread",
            "label": "Закрыть уведомления",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-presentation-ready-unread",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [],
        "region_id": "notifications-list",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "ada7703742053f06ab603be4f6e62a81db8fc8d50352e1b6bb301afaa11e399d"
    },
    {
      "id": "lisa-notification-detail-unread",
      "kind": "notification-detail",
      "display_name": "Уведомление — есть новое",
      "title": "Презентация готова",
      "eyebrow": "Уведомление Лисы",
      "body": "Откройте нередактируемую PDF-копию презентации.",
      "detail_lines": [
        "Сегодня, 13:44"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": true,
      "action_ids": [
        "open-result-from-notification",
        "close-notifications-unread"
      ],
      "actions": [
        {
          "id": "open-result-from-notification",
          "label": "Открыть презентацию",
          "variant": "primary",
          "target_state_id": "lisa-result-view-from-notification"
        },
        {
          "id": "close-notifications-unread",
          "label": "Закрыть уведомления",
          "variant": "secondary",
          "target_state_id": "lisa-presentation-ready-unread"
        }
      ],
      "region_id": "notifications-list",
      "projection": {
        "state_id": "lisa-notification-detail-unread",
        "display_name": "Уведомление — есть новое",
        "kind": "notification-detail",
        "texts": [
          "Уведомление Лисы",
          "Презентация готова",
          "Откройте нередактируемую PDF-копию презентации.",
          "Сегодня, 13:44",
          "Открыть презентацию",
          "Закрыть уведомления"
        ],
        "actions": [
          {
            "id": "open-result-from-notification",
            "label": "Открыть презентацию",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-result-view-from-notification",
            "behavior": null,
            "prototype_sequence": []
          },
          {
            "id": "close-notifications-unread",
            "label": "Закрыть уведомления",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-presentation-ready-unread",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [],
        "region_id": "notifications-list",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "8148c24ed041f760160dfee9f5980547cb1b9102e666c3d27c1c4567b92fb428"
    },
    {
      "id": "lisa-notifications-list-read",
      "kind": "notification-list",
      "display_name": "Уведомления — всё прочитано",
      "title": "Уведомления",
      "eyebrow": "Лиса",
      "body": "Новых уведомлений нет",
      "detail_lines": [
        "Презентация готова",
        "Сегодня, 13:44"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": false,
      "action_ids": [
        "open-notification-read",
        "close-notifications-read"
      ],
      "actions": [
        {
          "id": "open-notification-read",
          "label": "Открыть уведомление",
          "variant": "primary",
          "target_state_id": "lisa-notification-detail-read"
        },
        {
          "id": "close-notifications-read",
          "label": "Закрыть уведомления",
          "variant": "secondary",
          "target_state_id": "lisa-returned-to-chat"
        }
      ],
      "region_id": "notifications-list",
      "projection": {
        "state_id": "lisa-notifications-list-read",
        "display_name": "Уведомления — всё прочитано",
        "kind": "notification-list",
        "texts": [
          "Лиса",
          "Уведомления",
          "Новых уведомлений нет",
          "Презентация готова",
          "Сегодня, 13:44",
          "Открыть уведомление",
          "Закрыть уведомления"
        ],
        "actions": [
          {
            "id": "open-notification-read",
            "label": "Открыть уведомление",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-notification-detail-read",
            "behavior": null,
            "prototype_sequence": []
          },
          {
            "id": "close-notifications-read",
            "label": "Закрыть уведомления",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-returned-to-chat",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [],
        "region_id": "notifications-list",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "6b054c2c59f786a46f1faaa3a13d5f6cc8f59b9ed47e3dc5c97d38ad7e5e7283"
    },
    {
      "id": "lisa-notification-detail-read",
      "kind": "notification-detail",
      "display_name": "Уведомление — прочитано",
      "title": "Презентация готова",
      "eyebrow": "Уведомление Лисы",
      "body": "Презентация уже открывалась. Нередактируемая PDF-копия остаётся доступной.",
      "detail_lines": [
        "Сегодня, 13:44"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": false,
      "action_ids": [
        "open-result-from-notification",
        "close-notifications-read"
      ],
      "actions": [
        {
          "id": "open-result-from-notification",
          "label": "Открыть презентацию",
          "variant": "primary",
          "target_state_id": "lisa-result-view-from-notification"
        },
        {
          "id": "close-notifications-read",
          "label": "Закрыть уведомления",
          "variant": "secondary",
          "target_state_id": "lisa-returned-to-chat"
        }
      ],
      "region_id": "notifications-list",
      "projection": {
        "state_id": "lisa-notification-detail-read",
        "display_name": "Уведомление — прочитано",
        "kind": "notification-detail",
        "texts": [
          "Уведомление Лисы",
          "Презентация готова",
          "Презентация уже открывалась. Нередактируемая PDF-копия остаётся доступной.",
          "Сегодня, 13:44",
          "Открыть презентацию",
          "Закрыть уведомления"
        ],
        "actions": [
          {
            "id": "open-result-from-notification",
            "label": "Открыть презентацию",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-result-view-from-notification",
            "behavior": null,
            "prototype_sequence": []
          },
          {
            "id": "close-notifications-read",
            "label": "Закрыть уведомления",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-returned-to-chat",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [],
        "region_id": "notifications-list",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "bc19f7eea1d739faa5c443584086732546ec8fda88dcf085cd303db254a4a275"
    },
    {
      "id": "lisa-result-view-from-chat",
      "kind": "viewer",
      "display_name": "Просмотр PDF — переход из чата",
      "title": "Презентация для встречи",
      "eyebrow": "PDF · только просмотр",
      "body": "Краткая презентация по материалам подготовки к встрече.",
      "detail_lines": [
        "1. Контекст рынка",
        "2. Ситуация клиента",
        "3. Возможности для разговора"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": false,
      "return_anchor": "presentation-ready-card",
      "action_ids": [
        "close-result",
        "email-presentation"
      ],
      "actions": [
        {
          "id": "close-result",
          "label": "Закрыть презентацию",
          "variant": "secondary",
          "target_state_id": "lisa-returned-to-chat"
        },
        {
          "id": "email-presentation",
          "label": "Отправить презентацию на почту",
          "variant": "primary",
          "target_state_id": "lisa-presentation-email-submitting",
          "prototype_sequence": [
            {
              "state_id": "lisa-presentation-email-sent",
              "at_ms": 900
            }
          ]
        }
      ],
      "region_id": "viewer-surface",
      "projection": {
        "state_id": "lisa-result-view-from-chat",
        "display_name": "Просмотр PDF — переход из чата",
        "kind": "viewer",
        "texts": [
          "PDF · только просмотр",
          "Презентация для встречи",
          "Краткая презентация по материалам подготовки к встрече.",
          "1. Контекст рынка",
          "2. Ситуация клиента",
          "3. Возможности для разговора",
          "Закрыть презентацию",
          "Отправить презентацию на почту"
        ],
        "actions": [
          {
            "id": "close-result",
            "label": "Закрыть презентацию",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-returned-to-chat",
            "behavior": null,
            "prototype_sequence": []
          },
          {
            "id": "email-presentation",
            "label": "Отправить презентацию на почту",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-presentation-email-submitting",
            "behavior": null,
            "prototype_sequence": [
              {
                "state_id": "lisa-presentation-email-sent",
                "at_ms": 900
              }
            ]
          }
        ],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [],
        "region_id": "viewer-surface",
        "component_ids": []
      },
      "projection_sha256": "6ee47bf5867db7f11b79128b5f156b8657b4b2f4fd6525a1a5a0e40472981e97"
    },
    {
      "id": "lisa-result-view-from-notification",
      "kind": "viewer",
      "display_name": "Просмотр PDF — переход из уведомления",
      "title": "Презентация для встречи",
      "eyebrow": "PDF · только просмотр",
      "body": "Краткая презентация по материалам подготовки к встрече.",
      "detail_lines": [
        "1. Контекст рынка",
        "2. Ситуация клиента",
        "3. Возможности для разговора"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": false,
      "return_anchor": "presentation-ready-card",
      "action_ids": [
        "close-result",
        "email-presentation"
      ],
      "actions": [
        {
          "id": "close-result",
          "label": "Закрыть презентацию",
          "variant": "secondary",
          "target_state_id": "lisa-returned-to-chat"
        },
        {
          "id": "email-presentation",
          "label": "Отправить презентацию на почту",
          "variant": "primary",
          "target_state_id": "lisa-presentation-email-submitting",
          "prototype_sequence": [
            {
              "state_id": "lisa-presentation-email-sent",
              "at_ms": 900
            }
          ]
        }
      ],
      "region_id": "viewer-surface",
      "projection": {
        "state_id": "lisa-result-view-from-notification",
        "display_name": "Просмотр PDF — переход из уведомления",
        "kind": "viewer",
        "texts": [
          "PDF · только просмотр",
          "Презентация для встречи",
          "Краткая презентация по материалам подготовки к встрече.",
          "1. Контекст рынка",
          "2. Ситуация клиента",
          "3. Возможности для разговора",
          "Закрыть презентацию",
          "Отправить презентацию на почту"
        ],
        "actions": [
          {
            "id": "close-result",
            "label": "Закрыть презентацию",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-returned-to-chat",
            "behavior": null,
            "prototype_sequence": []
          },
          {
            "id": "email-presentation",
            "label": "Отправить презентацию на почту",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-presentation-email-submitting",
            "behavior": null,
            "prototype_sequence": [
              {
                "state_id": "lisa-presentation-email-sent",
                "at_ms": 900
              }
            ]
          }
        ],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [],
        "region_id": "viewer-surface",
        "component_ids": []
      },
      "projection_sha256": "0fcff9a797c338b273d72d28fa88298f1d729920954cd91ca6a3f38e596a0ce7"
    },
    {
      "id": "lisa-returned-to-chat",
      "kind": "chat-ready",
      "display_name": "Чат — презентация доступна после просмотра",
      "title": "Презентация готова",
      "eyebrow": "DataCanvas",
      "body": "Презентацию можно открыть повторно или отправить на почту. Текущий контекст разговора сохранён.",
      "detail_lines": [
        "PDF будет приложен для просмотра, PPTX — для редактирования."
      ],
      "history_state_ids": [
        "lisa-materials-ready",
        "lisa-presentation-generating"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": false,
      "action_ids": [
        "open-result-from-chat",
        "email-presentation"
      ],
      "actions": [
        {
          "id": "open-result-from-chat",
          "label": "Открыть презентацию",
          "variant": "primary",
          "target_state_id": "lisa-result-view-from-chat"
        },
        {
          "id": "email-presentation",
          "label": "Отправить презентацию на почту",
          "variant": "primary",
          "target_state_id": "lisa-presentation-email-submitting",
          "prototype_sequence": [
            {
              "state_id": "lisa-presentation-email-sent",
              "at_ms": 900
            }
          ]
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-returned-to-chat",
        "display_name": "Чат — презентация доступна после просмотра",
        "kind": "chat-ready",
        "texts": [
          "DataCanvas",
          "Презентация готова",
          "Презентацию можно открыть повторно или отправить на почту. Текущий контекст разговора сохранён.",
          "PDF будет приложен для просмотра, PPTX — для редактирования.",
          "Открыть презентацию",
          "Отправить презентацию на почту"
        ],
        "actions": [
          {
            "id": "open-result-from-chat",
            "label": "Открыть презентацию",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-result-view-from-chat",
            "behavior": null,
            "prototype_sequence": []
          },
          {
            "id": "email-presentation",
            "label": "Отправить презентацию на почту",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-presentation-email-submitting",
            "behavior": null,
            "prototype_sequence": [
              {
                "state_id": "lisa-presentation-email-sent",
                "at_ms": 900
              }
            ]
          }
        ],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [
          "lisa-materials-ready",
          "lisa-presentation-generating"
        ],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "25ba274a1947e95f410fc20d34924c062212dc9480f84f1f93c2314e0720a9df"
    },
    {
      "id": "lisa-presentation-email-submitting",
      "kind": "chat",
      "display_name": "Отправка презентации — выполняется",
      "title": "Отправляем презентацию",
      "eyebrow": "DataCanvas",
      "body": "Готовим одно письмо с двумя вложениями: PDF и PPTX.",
      "detail_lines": [
        "Сообщение появится, когда письмо с обоими файлами будет принято к отправке."
      ],
      "history_state_ids": [
        "lisa-materials-ready",
        "lisa-presentation-generating",
        "lisa-returned-to-chat"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": false,
      "action_ids": [],
      "actions": [],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-presentation-email-submitting",
        "display_name": "Отправка презентации — выполняется",
        "kind": "chat",
        "texts": [
          "DataCanvas",
          "Отправляем презентацию",
          "Готовим одно письмо с двумя вложениями: PDF и PPTX.",
          "Сообщение появится, когда письмо с обоими файлами будет принято к отправке."
        ],
        "actions": [],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [
          "lisa-materials-ready",
          "lisa-presentation-generating",
          "lisa-returned-to-chat"
        ],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "c2326167fe77d10e37255f51c0235bff91bc5f8c40fad3813adb8430309e4cad"
    },
    {
      "id": "lisa-presentation-email-sent",
      "kind": "success",
      "display_name": "Отправка презентации — завершена",
      "title": "Презентация отправлена",
      "eyebrow": "DataCanvas",
      "body": "Письмо с презентацией отправлено на вашу рабочую почту.",
      "detail_lines": [
        "Вложения: PDF и PPTX."
      ],
      "history_state_ids": [
        "lisa-materials-ready",
        "lisa-presentation-generating",
        "lisa-returned-to-chat"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": false,
      "action_ids": [
        "return-to-ready"
      ],
      "actions": [
        {
          "id": "return-to-ready",
          "label": "Вернуться к результату",
          "variant": "secondary",
          "target_state_id": "lisa-returned-to-chat"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-presentation-email-sent",
        "display_name": "Отправка презентации — завершена",
        "kind": "success",
        "texts": [
          "DataCanvas",
          "Презентация отправлена",
          "Письмо с презентацией отправлено на вашу рабочую почту.",
          "Вложения: PDF и PPTX.",
          "Вернуться к результату"
        ],
        "actions": [
          {
            "id": "return-to-ready",
            "label": "Вернуться к результату",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-returned-to-chat",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [
          "lisa-materials-ready",
          "lisa-presentation-generating",
          "lisa-returned-to-chat"
        ],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "d854a6acfa7b407d56b288ea4de3f283aae6eec9483fcdfa815fb01a553be0eb"
    },
    {
      "id": "lisa-presentation-email-partial-failure",
      "kind": "error",
      "display_name": "Отправка презентации — не добавлен PPTX",
      "title": "Не удалось добавить PPTX",
      "eyebrow": "DataCanvas",
      "body": "Письмо ещё не отправлено: PDF готов, а PPTX добавить не удалось.",
      "detail_lines": [
        "Повторная попытка касается только PPTX; письмо уйдёт после подготовки обоих файлов."
      ],
      "history_state_ids": [
        "lisa-materials-ready",
        "lisa-presentation-generating",
        "lisa-returned-to-chat"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": false,
      "action_ids": [
        "retry-failed-attachment",
        "return-to-ready"
      ],
      "actions": [
        {
          "id": "retry-failed-attachment",
          "label": "Повторить отправку PPTX",
          "variant": "primary",
          "target_state_id": "lisa-presentation-email-submitting",
          "prototype_sequence": [
            {
              "state_id": "lisa-presentation-email-sent",
              "at_ms": 900
            }
          ]
        },
        {
          "id": "return-to-ready",
          "label": "Вернуться к результату",
          "variant": "secondary",
          "target_state_id": "lisa-returned-to-chat"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-presentation-email-partial-failure",
        "display_name": "Отправка презентации — не добавлен PPTX",
        "kind": "error",
        "texts": [
          "DataCanvas",
          "Не удалось добавить PPTX",
          "Письмо ещё не отправлено: PDF готов, а PPTX добавить не удалось.",
          "Повторная попытка касается только PPTX; письмо уйдёт после подготовки обоих файлов.",
          "Повторить отправку PPTX",
          "Вернуться к результату"
        ],
        "actions": [
          {
            "id": "retry-failed-attachment",
            "label": "Повторить отправку PPTX",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-presentation-email-submitting",
            "behavior": null,
            "prototype_sequence": [
              {
                "state_id": "lisa-presentation-email-sent",
                "at_ms": 900
              }
            ]
          },
          {
            "id": "return-to-ready",
            "label": "Вернуться к результату",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-returned-to-chat",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [
          "lisa-materials-ready",
          "lisa-presentation-generating",
          "lisa-returned-to-chat"
        ],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "884289577922dd403649effe110c98bd43182761771ddd133e81c9f8521887db"
    },
    {
      "id": "lisa-presentation-email-failed",
      "kind": "error",
      "display_name": "Отправка презентации — ошибка",
      "title": "Презентация не отправлена",
      "eyebrow": "DataCanvas",
      "body": "Не удалось отправить письмо с вложениями.",
      "detail_lines": [
        "Повторите попытку позже. Ссылка на PDF остаётся доступной в Лисе."
      ],
      "history_state_ids": [
        "lisa-materials-ready",
        "lisa-presentation-generating",
        "lisa-returned-to-chat"
      ],
      "result_ref": "secure-pdf-copy-001",
      "notification_unread": false,
      "action_ids": [
        "retry-email",
        "return-to-ready"
      ],
      "actions": [
        {
          "id": "retry-email",
          "label": "Повторить отправку",
          "variant": "primary",
          "target_state_id": "lisa-presentation-email-submitting",
          "prototype_sequence": [
            {
              "state_id": "lisa-presentation-email-sent",
              "at_ms": 900
            }
          ]
        },
        {
          "id": "return-to-ready",
          "label": "Вернуться к результату",
          "variant": "secondary",
          "target_state_id": "lisa-returned-to-chat"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-presentation-email-failed",
        "display_name": "Отправка презентации — ошибка",
        "kind": "error",
        "texts": [
          "DataCanvas",
          "Презентация не отправлена",
          "Не удалось отправить письмо с вложениями.",
          "Повторите попытку позже. Ссылка на PDF остаётся доступной в Лисе.",
          "Повторить отправку",
          "Вернуться к результату"
        ],
        "actions": [
          {
            "id": "retry-email",
            "label": "Повторить отправку",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-presentation-email-submitting",
            "behavior": null,
            "prototype_sequence": [
              {
                "state_id": "lisa-presentation-email-sent",
                "at_ms": 900
              }
            ]
          },
          {
            "id": "return-to-ready",
            "label": "Вернуться к результату",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-returned-to-chat",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": "secure-pdf-copy-001",
        "history_state_ids": [
          "lisa-materials-ready",
          "lisa-presentation-generating",
          "lisa-returned-to-chat"
        ],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "9f2b41cc4b3cd9f45ead0bc8f1f810c5152d61e2ac59d68bb874ef10342ace58"
    },
    {
      "id": "lisa-result-not-ready",
      "kind": "error",
      "display_name": "Открытие презентации — ещё не готова",
      "title": "Презентация ещё готовится",
      "eyebrow": "DataCanvas",
      "body": "Результат пока нельзя открыть.",
      "detail_lines": [
        "Вернитесь в чат: готовность появится отдельной карточкой и уведомлением."
      ],
      "action_ids": [
        "return-to-generation"
      ],
      "actions": [
        {
          "id": "return-to-generation",
          "label": "Вернуться в чат",
          "variant": "secondary",
          "target_state_id": "lisa-presentation-generating"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-result-not-ready",
        "display_name": "Открытие презентации — ещё не готова",
        "kind": "error",
        "texts": [
          "DataCanvas",
          "Презентация ещё готовится",
          "Результат пока нельзя открыть.",
          "Вернитесь в чат: готовность появится отдельной карточкой и уведомлением.",
          "Вернуться в чат"
        ],
        "actions": [
          {
            "id": "return-to-generation",
            "label": "Вернуться в чат",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-presentation-generating",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": null,
        "history_state_ids": [],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "e96c0aa514b3e99f944a1a9ca49e09080c1b759aa25750b66f3677a3e65300e6"
    },
    {
      "id": "lisa-link-invalid",
      "kind": "error",
      "display_name": "Открытие презентации — неверная ссылка",
      "title": "Ссылка недействительна",
      "eyebrow": "Защищённое хранилище",
      "body": "Лиса не может открыть результат по этой ссылке.",
      "detail_lines": [
        "Вернитесь к карточке результата и попробуйте снова."
      ],
      "action_ids": [
        "return-to-ready"
      ],
      "actions": [
        {
          "id": "return-to-ready",
          "label": "Вернуться к результату",
          "variant": "secondary",
          "target_state_id": "lisa-returned-to-chat"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-link-invalid",
        "display_name": "Открытие презентации — неверная ссылка",
        "kind": "error",
        "texts": [
          "Защищённое хранилище",
          "Ссылка недействительна",
          "Лиса не может открыть результат по этой ссылке.",
          "Вернитесь к карточке результата и попробуйте снова.",
          "Вернуться к результату"
        ],
        "actions": [
          {
            "id": "return-to-ready",
            "label": "Вернуться к результату",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-returned-to-chat",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": null,
        "history_state_ids": [],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "00e0d960a20f54180897c5d6d732f41fe121deba18b74a820abeeb7bb17debc3"
    },
    {
      "id": "lisa-link-expired",
      "kind": "error",
      "display_name": "Открытие презентации — истёкшая ссылка",
      "title": "Срок действия ссылки истёк",
      "eyebrow": "Защищённое хранилище",
      "body": "Результат больше нельзя открыть по этой ссылке.",
      "detail_lines": [
        "Вернитесь в чат: результат нельзя открыть по этой ссылке."
      ],
      "action_ids": [
        "return-to-ready"
      ],
      "actions": [
        {
          "id": "return-to-ready",
          "label": "Вернуться к результату",
          "variant": "secondary",
          "target_state_id": "lisa-returned-to-chat"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-link-expired",
        "display_name": "Открытие презентации — истёкшая ссылка",
        "kind": "error",
        "texts": [
          "Защищённое хранилище",
          "Срок действия ссылки истёк",
          "Результат больше нельзя открыть по этой ссылке.",
          "Вернитесь в чат: результат нельзя открыть по этой ссылке.",
          "Вернуться к результату"
        ],
        "actions": [
          {
            "id": "return-to-ready",
            "label": "Вернуться к результату",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-returned-to-chat",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": null,
        "history_state_ids": [],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "4312f3711c213950eaa9078b36c52ef2eb0d02164cd01c0b3c4f780723180b76"
    },
    {
      "id": "lisa-access-denied",
      "kind": "error",
      "display_name": "Открытие презентации — нет доступа",
      "title": "Нет доступа",
      "eyebrow": "Защищённое хранилище",
      "body": "У текущего пользователя нет доступа к этой копии презентации.",
      "detail_lines": [
        "Вернитесь в чат. Дополнительный доступ в этом сценарии не запрашивается."
      ],
      "action_ids": [
        "return-to-ready"
      ],
      "actions": [
        {
          "id": "return-to-ready",
          "label": "Вернуться к результату",
          "variant": "secondary",
          "target_state_id": "lisa-returned-to-chat"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-access-denied",
        "display_name": "Открытие презентации — нет доступа",
        "kind": "error",
        "texts": [
          "Защищённое хранилище",
          "Нет доступа",
          "У текущего пользователя нет доступа к этой копии презентации.",
          "Вернитесь в чат. Дополнительный доступ в этом сценарии не запрашивается.",
          "Вернуться к результату"
        ],
        "actions": [
          {
            "id": "return-to-ready",
            "label": "Вернуться к результату",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-returned-to-chat",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": null,
        "history_state_ids": [],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "ed0105cc3971b836e4889b685c8201a339fe597e65f09e6a2b03076b6d2bf28f"
    },
    {
      "id": "lisa-offline",
      "kind": "error",
      "display_name": "Открытие презентации — нет сети",
      "title": "Нет соединения",
      "eyebrow": "Лиса",
      "body": "Не удалось открыть презентацию без сети.",
      "detail_lines": [
        "Текущий чат сохранён. Повторите попытку после восстановления соединения."
      ],
      "action_ids": [
        "retry-open-result",
        "return-to-ready"
      ],
      "actions": [
        {
          "id": "retry-open-result",
          "label": "Повторить открытие",
          "variant": "primary",
          "target_state_id": "lisa-result-view-from-chat"
        },
        {
          "id": "return-to-ready",
          "label": "Вернуться к результату",
          "variant": "secondary",
          "target_state_id": "lisa-returned-to-chat"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-offline",
        "display_name": "Открытие презентации — нет сети",
        "kind": "error",
        "texts": [
          "Лиса",
          "Нет соединения",
          "Не удалось открыть презентацию без сети.",
          "Текущий чат сохранён. Повторите попытку после восстановления соединения.",
          "Повторить открытие",
          "Вернуться к результату"
        ],
        "actions": [
          {
            "id": "retry-open-result",
            "label": "Повторить открытие",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-result-view-from-chat",
            "behavior": null,
            "prototype_sequence": []
          },
          {
            "id": "return-to-ready",
            "label": "Вернуться к результату",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-returned-to-chat",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": null,
        "history_state_ids": [],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "63bf8713cd4e58758a1431e413de63934b743878d70cb605baae1b1074f52167"
    },
    {
      "id": "lisa-notification-failed-chat-available",
      "kind": "warning",
      "display_name": "Уведомление — ошибка доставки, чат доступен",
      "title": "Уведомление не доставлено",
      "eyebrow": "Лиса",
      "body": "Карточка готовой презентации доступна в чате, но запись центра уведомлений не создана.",
      "detail_lines": [
        "Откройте результат из карточки в чате."
      ],
      "notification_unread": false,
      "action_ids": [
        "open-result-from-chat"
      ],
      "actions": [
        {
          "id": "open-result-from-chat",
          "label": "Открыть презентацию",
          "variant": "primary",
          "target_state_id": "lisa-result-view-from-chat"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-notification-failed-chat-available",
        "display_name": "Уведомление — ошибка доставки, чат доступен",
        "kind": "warning",
        "texts": [
          "Лиса",
          "Уведомление не доставлено",
          "Карточка готовой презентации доступна в чате, но запись центра уведомлений не создана.",
          "Откройте результат из карточки в чате.",
          "Открыть презентацию"
        ],
        "actions": [
          {
            "id": "open-result-from-chat",
            "label": "Открыть презентацию",
            "accessible_label": null,
            "variant": "primary",
            "target_state_id": "lisa-result-view-from-chat",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": null,
        "history_state_ids": [],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "ed7dc28c0e346f969e3ef0647fb3bdafa43d4c64cf43c437e7453e68c995f333"
    },
    {
      "id": "lisa-result-cancelled",
      "kind": "error",
      "display_name": "Подготовка презентации — отменена",
      "title": "Подготовка отменена",
      "eyebrow": "DataCanvas",
      "body": "Презентация не была подготовлена.",
      "detail_lines": [
        "Новый заказ можно оформить с экрана итоговых материалов."
      ],
      "action_ids": [
        "return-to-materials"
      ],
      "actions": [
        {
          "id": "return-to-materials",
          "label": "Вернуться к материалам",
          "variant": "secondary",
          "target_state_id": "lisa-materials-ready"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-result-cancelled",
        "display_name": "Подготовка презентации — отменена",
        "kind": "error",
        "texts": [
          "DataCanvas",
          "Подготовка отменена",
          "Презентация не была подготовлена.",
          "Новый заказ можно оформить с экрана итоговых материалов.",
          "Вернуться к материалам"
        ],
        "actions": [
          {
            "id": "return-to-materials",
            "label": "Вернуться к материалам",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-materials-ready",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": null,
        "history_state_ids": [],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "b2a6865df29f74a9af15c5c0dea265c667e635c5b9694821a0d418ee5ba1f5d0"
    },
    {
      "id": "lisa-result-revoked",
      "kind": "error",
      "display_name": "Открытие презентации — результат отозван",
      "title": "Результат отозван",
      "eyebrow": "Защищённое хранилище",
      "body": "Ссылка на PDF-копию больше не открывается.",
      "detail_lines": [
        "Вернитесь к итоговым материалам: этот результат нельзя открыть повторно."
      ],
      "action_ids": [
        "return-to-materials"
      ],
      "actions": [
        {
          "id": "return-to-materials",
          "label": "Вернуться к материалам",
          "variant": "secondary",
          "target_state_id": "lisa-materials-ready"
        }
      ],
      "region_id": "chat",
      "projection": {
        "state_id": "lisa-result-revoked",
        "display_name": "Открытие презентации — результат отозван",
        "kind": "error",
        "texts": [
          "Защищённое хранилище",
          "Результат отозван",
          "Ссылка на PDF-копию больше не открывается.",
          "Вернитесь к итоговым материалам: этот результат нельзя открыть повторно.",
          "Вернуться к материалам"
        ],
        "actions": [
          {
            "id": "return-to-materials",
            "label": "Вернуться к материалам",
            "accessible_label": null,
            "variant": "secondary",
            "target_state_id": "lisa-materials-ready",
            "behavior": null,
            "prototype_sequence": []
          }
        ],
        "result_ref": null,
        "history_state_ids": [],
        "region_id": "chat",
        "component_ids": [
          "lisa-phone-shell",
          "lisa-notification-bell"
        ]
      },
      "projection_sha256": "95834ee9a33c4985c77607595b89c22db8c11c403dc247cf1676c5a5ddb0ebe1"
    }
  ]
};
