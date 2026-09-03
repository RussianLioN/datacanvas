window.LISA_BROWSER_NATIVE_PHONE_DATA = {
  "version": "1.5.0",
  "status": "owner_final_approved",
  "initialStateId": "lisa-materials-full-reference",
  "logicalScreen": {
    "width": 393,
    "height": 852
  },
  "phoneGeometry": {
    "viewBox": "0 0 78.1 160.8",
    "elements": [
      {
        "tag": "rect",
        "attributes": {
          "id": "phone-body",
          "x": "0",
          "y": "0",
          "width": "78.1",
          "height": "160.8",
          "rx": "11.8",
          "fill": "#1a1a1d"
        }
      },
      {
        "tag": "rect",
        "attributes": {
          "id": "phone-glass",
          "x": "0.35",
          "y": "0.35",
          "width": "77.4",
          "height": "160.1",
          "rx": "11.3",
          "fill": "#111217"
        }
      },
      {
        "tag": "rect",
        "attributes": {
          "id": "phone-active-display",
          "x": "1.1567",
          "y": "1.1567",
          "width": "75.7866",
          "height": "158.4866",
          "rx": "10.2",
          "fill": "#ffffff"
        }
      },
      {
        "tag": "path",
        "attributes": {
          "id": "phone-notch",
          "d": "M21.12 1.1567h34.83v3.16c0 1.19-.97 2.16-2.16 2.16H23.28a2.16 2.16 0 0 1-2.16-2.16V1.1567Z",
          "fill": "#111217"
        }
      },
      {
        "tag": "rect",
        "attributes": {
          "id": "phone-speaker",
          "x": "33.4",
          "y": "2.9067",
          "width": "10.27",
          "height": "0.62",
          "rx": "0.31",
          "fill": "#24252a"
        }
      }
    ],
    "hasSideControls": false,
    "visibleBezelLogicalUnitsMax": 1.157
  },
  "phoneStateIds": [
    "lisa-materials-full-reference",
    "lisa-presentation-generating",
    "lisa-presentation-chat-list",
    "lisa-presentation-sent",
    "lisa-order-not-accepted",
    "lisa-delivery-delayed",
    "lisa-delivery-partial"
  ],
  "externalStateIds": [
    "lisa-presentation-email",
    "lisa-presentation-slidedoc",
    "lisa-presentation-sber2025",
    "lisa-presentation-mag"
  ],
  "transitions": [
    {
      "from": "lisa-materials-full-reference",
      "event": "order_presentation",
      "to": "lisa-presentation-generating"
    },
    {
      "from": "lisa-presentation-generating",
      "event": "delivery_confirmed",
      "to": "lisa-presentation-sent"
    },
    {
      "from": "lisa-presentation-generating",
      "event": "data_not_accepted",
      "to": "lisa-order-not-accepted"
    },
    {
      "from": "lisa-presentation-generating",
      "event": "delivery_delayed",
      "to": "lisa-delivery-delayed"
    },
    {
      "from": "lisa-presentation-generating",
      "event": "delivery_unconfirmed",
      "to": "lisa-delivery-partial"
    },
    {
      "from": "lisa-presentation-sent",
      "event": "open_delivery_email",
      "to": "lisa-presentation-email"
    }
  ],
  "viewerShell": {
    "documentTitle": "Прототип заказа презентации из агента \"Справка по клиенту\"",
    "panelTitle": "Прототип заказа презентации из агента \"Справка по клиенту\"",
    "phoneStateCaptions": {
      "lisa-materials-full-reference": "Заказ презентации по справке по клиенту",
      "lisa-presentation-generating": "Успешное начало изготовления презентации",
      "lisa-presentation-chat-list": "Список чатов и возврат к исходному экрану",
      "lisa-presentation-sent": "Презентация направлена по электронной почте",
      "lisa-order-not-accepted": "Данные не приняты для формирования презентации",
      "lisa-delivery-delayed": "Отправка презентации в SIGMA задерживается",
      "lisa-delivery-partial": "Частичная или неподтверждённая доставка презентации"
    },
    "externalPanelHidden": true
  },
  "viewerNavigation": {
    "frameSequence": [
      "lisa-materials-full-reference",
      "lisa-presentation-generating",
      "lisa-presentation-chat-list",
      "lisa-presentation-sent",
      "lisa-presentation-email",
      "lisa-presentation-slidedoc",
      "lisa-presentation-sber2025",
      "lisa-presentation-mag",
      "lisa-order-not-accepted",
      "lisa-delivery-delayed",
      "lisa-delivery-partial"
    ],
    "phonePanel": {
      "controls": [
        "previous_frame",
        "next_frame"
      ]
    },
    "externalOverlay": {
      "email_controls": [
        "previous_frame",
        "next_frame"
      ],
      "presentation_controls": [
        "previous_frame",
        "next_frame",
        "previous_page",
        "next_page"
      ],
      "minimum_target_css_px": 44
    },
    "chatList": {
      "openFromStateIds": [
        "lisa-materials-full-reference",
        "lisa-presentation-generating",
        "lisa-presentation-sent",
        "lisa-order-not-accepted",
        "lisa-delivery-delayed",
        "lisa-delivery-partial"
      ],
      "returnToOrigin": true,
      "restoreScrollPosition": true,
      "directUrlFallbackStateId": "lisa-presentation-sent"
    },
    "presentationPages": {
      "page_count": 3,
      "logical_page": {
        "width": 960,
        "height": 540
      }
    }
  },
  "states": [
    {
      "id": "lisa-materials-full-reference",
      "kind": "phone",
      "phoneTime": "13:24",
      "initialScrollPosition": "top",
      "buttonState": "enabled",
      "nodes": [
        {
          "id": "phone-status-time",
          "role": "status-time",
          "sectionId": "chrome",
          "order": 1,
          "text": "13:24",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 88,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 12,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "assistant-name",
          "role": "assistant-name",
          "sectionId": "chrome",
          "order": 2,
          "text": "Лиса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "reference-title",
          "role": "reference-title",
          "sectionId": "reference-header",
          "order": 3,
          "text": "Справка по клиенту ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 18,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "general_information-title",
          "role": "section-title",
          "sectionId": "general_information",
          "order": 4,
          "text": "Общая информация о клиенте",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "general_information-0-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 5,
          "text": "Сокращённое наименование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-0-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 6,
          "text": "ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-1-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 7,
          "text": "ИНН",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-1-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 8,
          "text": "2461004230",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-2-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 9,
          "text": "Клиентский менеджер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-2-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 10,
          "text": "Стручкова Елена Витальевна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-3-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 11,
          "text": "ТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-3-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 12,
          "text": "Сибирский банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-4-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 13,
          "text": "ГОСБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-4-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 14,
          "text": "Восточное отделение №8594",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-5-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 15,
          "text": "Сегмент",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-5-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 16,
          "text": "Средний",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-6-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 17,
          "text": "Приоритет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-6-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 18,
          "text": "А",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-7-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 19,
          "text": "Уровень доверия",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-7-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 20,
          "text": "Друг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-8-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 21,
          "text": "Холдинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-8-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 22,
          "text": "ГК «Водолей»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-9-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 23,
          "text": "Направление бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-9-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 24,
          "text": "Оптовая продажа сантехники, труб и отопительного\nоборудования в Сибири",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-10-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 25,
          "text": "Макроотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-10-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 26,
          "text": "Розничная торговля товарами выборочного спроса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-11-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 27,
          "text": "Подотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-11-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 28,
          "text": "Стройматериалы, товары для дома, ремонта, сада",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-12-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 29,
          "text": "Численность",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-12-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 30,
          "text": "90 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-13-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 31,
          "text": "Срок работы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-13-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 32,
          "text": "14 лет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-14-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 33,
          "text": "Конкуренты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-14-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 34,
          "text": "Водная компания, Компания X, Мега Вода, Вода PRO,\nВодаМастер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-15-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 35,
          "text": "Контрагенты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-15-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 36,
          "text": "ВодныйМИР, Спасатель, Поставка, МикроВода",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-title",
          "role": "section-title",
          "sectionId": "business_owners",
          "order": 37,
          "text": "Собственники бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "business_owners-0-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 38,
          "text": "ФИО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-0-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 39,
          "text": "Доставалова Ирина Антоновна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-1-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 40,
          "text": "Роль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-1-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 41,
          "text": "Учредитель, Конечный бенефициар",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-2-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 42,
          "text": "Доля",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-2-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 43,
          "text": "100%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-3-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 44,
          "text": "Пакет услуг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-3-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 45,
          "text": "СберПервый",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-4-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 46,
          "text": "Инсайт 1",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-4-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 47,
          "text": "Одна из богатейших женщин Красноярска — купила два\nгектара земли и офисы на Калинина за 260 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-5-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 48,
          "text": "Инсайт 2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-5-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 49,
          "text": "Увлекается садоводством",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-title",
          "role": "section-title",
          "sectionId": "financial_indicators",
          "order": 50,
          "text": "Финансовые показатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "financial_indicators-0-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 51,
          "text": "Выручка, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-0-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 52,
          "text": "2 946,9",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-1-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 53,
          "text": "Выручка, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-1-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 54,
          "text": "2 598,8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-2-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 55,
          "text": "Динамика выручки",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-2-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 56,
          "text": "-11,8%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-3-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 57,
          "text": "EBITDA, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-3-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 58,
          "text": "190",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-4-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 59,
          "text": "EBITDA, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-4-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 60,
          "text": "125",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-5-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 61,
          "text": "Динамика EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-5-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 62,
          "text": "-35%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-6-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 63,
          "text": "Чистая прибыль, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-6-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 64,
          "text": "106,4",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-7-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 65,
          "text": "Чистая прибыль, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2136,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-7-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 66,
          "text": "66,2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2168,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-8-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 67,
          "text": "Динамика чистой прибыли",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2200,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-8-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 68,
          "text": "-38%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2232,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-9-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 69,
          "text": "Долг, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2264,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-9-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 70,
          "text": "223",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2296,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-10-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 71,
          "text": "Долг, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2328,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-10-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 72,
          "text": "183",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2360,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-11-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 73,
          "text": "Динамика долга",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2392,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-11-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 74,
          "text": "-40 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2424,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-12-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 75,
          "text": "Долг/EBITDA, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2456,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-12-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 76,
          "text": "1,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2488,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-13-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 77,
          "text": "Долг/EBITDA, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2520,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-13-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 78,
          "text": "1,6",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2552,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-14-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 79,
          "text": "Динамика долг/EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2584,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-14-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 80,
          "text": "+0,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2616,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-15-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 81,
          "text": "Рентабельность продаж, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2648,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-15-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 82,
          "text": "3,6%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2680,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-16-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 83,
          "text": "Рентабельность продаж, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2712,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-16-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 84,
          "text": "2,5%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2744,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-17-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 85,
          "text": "Динамика рентабельности продаж",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2776,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-17-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 86,
          "text": "-1,1 п.п.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2808,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-18-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 87,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2840,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-18-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 88,
          "text": "Компания испытывает финансовые трудности:\nснизились выручка, EBITDA, чистая прибыль и\nрентабельность продаж; долговая нагрузка\nухудшилась несмотря на снижение долга на 40 млн\nруб. Рекомендуются меры по восстановлению\nустойчивости и конкурентоспособности.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2872,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-title",
          "role": "section-title",
          "sectionId": "cooperation",
          "order": 89,
          "text": "Сотрудничество",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2904,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "cooperation-0-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 90,
          "text": "Количество продуктов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2936,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-0-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 91,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2968,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-1-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 92,
          "text": "ОД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3000,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-1-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 93,
          "text": "35",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3032,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-2-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 94,
          "text": "ОД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3064,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-2-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 95,
          "text": "52",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3096,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-3-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 96,
          "text": "Динамика ОД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3128,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-3-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 97,
          "text": "+17; положительная динамика, общий доход вырос за\nсчёт НКД и активов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3160,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-4-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 98,
          "text": "СДО Активы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3192,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-4-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 99,
          "text": "1100",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3224,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-5-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 100,
          "text": "СДО Активы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3256,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-5-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 101,
          "text": "1 300",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3288,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-6-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 102,
          "text": "Динамика СДО Активы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3320,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-6-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 103,
          "text": "+200; рост может отражать расширение деятельности\nили вложения в новые проекты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3352,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-7-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 104,
          "text": "СДО Пассивы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3384,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-7-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 105,
          "text": "90",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3416,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-8-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 106,
          "text": "СДО Пассивы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3448,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-8-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 107,
          "text": "115",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3480,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-9-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 108,
          "text": "Динамика СДО Пассивы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3512,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-9-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 109,
          "text": "+30; база в основном за счёт овернайта, остатки\nнестабильны",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3544,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-10-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 110,
          "text": "ФОТ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3576,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-10-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 111,
          "text": "17",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3608,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-11-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 112,
          "text": "ФОТ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3640,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-11-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 113,
          "text": "14",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3672,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-12-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 114,
          "text": "Динамика ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3704,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-12-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 115,
          "text": "-3; снижение может указывать на оптимизацию\nпроцессов, сокращение персонала или повышение\nэффективности",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3736,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-13-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 116,
          "text": "НКД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3768,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-13-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 117,
          "text": "12",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3800,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-14-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 118,
          "text": "НКД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3832,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-14-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 119,
          "text": "15",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3864,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-15-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 120,
          "text": "Динамика НКД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3896,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-15-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 121,
          "text": "+3; прирост в основном за счёт эквайринга и\nинкассации",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3928,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-16-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 122,
          "text": "Экосистема, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3960,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-16-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 123,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3992,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-17-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 124,
          "text": "Экосистема, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4024,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-17-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 125,
          "text": "8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4056,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-18-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 126,
          "text": "Динамика экосистемы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4088,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-18-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 127,
          "text": "+1; представлены СберЗдоровье и СберМаркетинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-19-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 128,
          "text": "ПФИ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-19-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 129,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-20-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 130,
          "text": "ПФИ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-20-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 131,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-21-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 132,
          "text": "Динамика ПФИ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-21-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 133,
          "text": "-; активности в направлении мало",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-22-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 134,
          "text": "Уникальные получатели, Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-22-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 135,
          "text": "45 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-23-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 136,
          "text": "Уникальные получатели, Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-23-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 137,
          "text": "80 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-24-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 138,
          "text": "Динамика уникальных получателей",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-24-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 139,
          "text": "+35; позитивный сигнал расширения сотрудничества в\nчасти ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-title",
          "role": "section-title",
          "sectionId": "sber_share",
          "order": 140,
          "text": "Доля в Сбере",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "sber_share-0-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 141,
          "text": "Кошелёк, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-0-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 142,
          "text": "В Сбере 1250; в других банках 250; доля Сбера 83%;\nвсего 1500; банк-конкурент Открытие",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-1-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 143,
          "text": "Уникальные получатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-1-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 144,
          "text": "В Сбере 80; в других банках 10; доля Сбера 89%;\nвсего 90; конкуренты Открытие, ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-2-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 145,
          "text": "РКО, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-2-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 146,
          "text": "В Сбере 750; в других банках 250; доля Сбера 75%;\nвсего 1000; конкуренты Открытие, ВТБ,\nРайффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-3-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 147,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-3-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 148,
          "text": "В Сбере 400; в других банках 200; доля Сбера 67%;\nвсего 600; конкурент Райффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-4-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 149,
          "text": "ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-4-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 150,
          "text": "В Сбере 700; в других банках 400; доля Сбера 64%;\nвсего 1100; конкуренты Открытие, ТКБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-5-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 151,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-5-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 152,
          "text": "Есть несоответствие доли Сбера по сравнению с\nдолей в кредитном портфеле по РКО, эквайрингу и\nВЭД. Рекомендуется нарастить объёмы для достижения\nдоли 83%.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-title",
          "role": "section-title",
          "sectionId": "active_deals",
          "order": 153,
          "text": "Сделки в работе",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "active_deals-0-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 154,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-0-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 155,
          "text": "1 млрд руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-1-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 156,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-1-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 157,
          "text": "200 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-2-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 158,
          "text": "Инкассация",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-2-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 159,
          "text": "500 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-title",
          "role": "section-title",
          "sectionId": "potential",
          "order": 160,
          "text": "Потенциал",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "potential-0-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 161,
          "text": "Краткосрочное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-0-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 162,
          "text": "500 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-1-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 163,
          "text": "Телемедицина",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-1-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 164,
          "text": "5 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-title",
          "role": "section-title",
          "sectionId": "preapproved_offers",
          "order": 165,
          "text": "Предодобренные предложения",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "preapproved_offers-0-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 166,
          "text": "Оборотное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-0-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 167,
          "text": "ВКЛ на 100 млн рублей до 36 мес",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-1-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 168,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-1-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 169,
          "text": "Гарантии ИФНС на 500 млн руб до 12 мес;\nотклонение: верификация ОКК",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-title",
          "role": "section-title",
          "sectionId": "insights",
          "order": 170,
          "text": "Инсайты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "insights-0-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 171,
          "text": "Альфа-Банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-0-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 172,
          "text": "Эквайринг 1,5% против 1,7% у Сбера; бесплатные КСО\nс абонплатой 5 000 ₽",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-1-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 173,
          "text": "ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-1-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 174,
          "text": "Предложили эквайринг 1,7% без НДС",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-2-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 175,
          "text": "Открытие и ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-2-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 176,
          "text": "Уже занимают часть ФОТ и ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-3-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 177,
          "text": "Отношение клиента",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-3-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 178,
          "text": "Клиент называет зарплатный проект Сбера «скучным и\nневыгодным»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-title",
          "role": "section-title",
          "sectionId": "meeting_agreements",
          "order": 179,
          "text": "Договорённости с последней встречи",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "meeting_agreements-0-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 180,
          "text": "Поставщики",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-0-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 181,
          "text": "Поиск альтернативных поставщиков оборудования из\nИндии по сниженной цене",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-1-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 182,
          "text": "КСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-1-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 183,
          "text": "Консультация технических специалистов по внедрению\nКСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-2-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 184,
          "text": "Валютное хеджирование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-2-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 185,
          "text": "Предоставление информации и поддержки по валютному\nхеджированию",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-3-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 186,
          "text": "ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-3-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 187,
          "text": "Получение ясности по срокам кредита от ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "create-presentation",
          "role": "primary-action",
          "sectionId": "primary-action",
          "order": 188,
          "text": "Создать презентацию по справке",
          "copyId": "button_label",
          "action": "order_presentation",
          "tone": "enabled",
          "layout": {
            "x": 24,
            "y": 6072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 17,
            "fontWeight": 700,
            "fill": "#ffffff"
          }
        },
        {
          "id": "composer-placeholder",
          "role": "composer-placeholder",
          "sectionId": "composer",
          "order": 189,
          "text": "Задайте любой вопрос…",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 400,
            "fill": "#9da6b8"
          }
        }
      ],
      "sourceSha256": "019f2f12cf4b353a5c42849ff21bcb06c8d95e8d1e15d85d1c30aec00606e24a"
    },
    {
      "id": "lisa-presentation-generating",
      "kind": "phone",
      "phoneTime": "13:24",
      "initialScrollPosition": "bottom",
      "buttonState": "disabled",
      "nodes": [
        {
          "id": "phone-status-time",
          "role": "status-time",
          "sectionId": "chrome",
          "order": 1,
          "text": "13:24",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 88,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 12,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "assistant-name",
          "role": "assistant-name",
          "sectionId": "chrome",
          "order": 2,
          "text": "Лиса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "reference-title",
          "role": "reference-title",
          "sectionId": "reference-header",
          "order": 3,
          "text": "Справка по клиенту ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 18,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "general_information-title",
          "role": "section-title",
          "sectionId": "general_information",
          "order": 4,
          "text": "Общая информация о клиенте",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "general_information-0-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 5,
          "text": "Сокращённое наименование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-0-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 6,
          "text": "ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-1-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 7,
          "text": "ИНН",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-1-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 8,
          "text": "2461004230",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-2-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 9,
          "text": "Клиентский менеджер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-2-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 10,
          "text": "Стручкова Елена Витальевна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-3-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 11,
          "text": "ТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-3-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 12,
          "text": "Сибирский банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-4-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 13,
          "text": "ГОСБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-4-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 14,
          "text": "Восточное отделение №8594",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-5-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 15,
          "text": "Сегмент",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-5-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 16,
          "text": "Средний",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-6-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 17,
          "text": "Приоритет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-6-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 18,
          "text": "А",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-7-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 19,
          "text": "Уровень доверия",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-7-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 20,
          "text": "Друг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-8-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 21,
          "text": "Холдинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-8-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 22,
          "text": "ГК «Водолей»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-9-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 23,
          "text": "Направление бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-9-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 24,
          "text": "Оптовая продажа сантехники, труб и отопительного\nоборудования в Сибири",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-10-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 25,
          "text": "Макроотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-10-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 26,
          "text": "Розничная торговля товарами выборочного спроса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-11-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 27,
          "text": "Подотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-11-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 28,
          "text": "Стройматериалы, товары для дома, ремонта, сада",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-12-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 29,
          "text": "Численность",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-12-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 30,
          "text": "90 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-13-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 31,
          "text": "Срок работы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-13-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 32,
          "text": "14 лет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-14-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 33,
          "text": "Конкуренты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-14-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 34,
          "text": "Водная компания, Компания X, Мега Вода, Вода PRO,\nВодаМастер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-15-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 35,
          "text": "Контрагенты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-15-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 36,
          "text": "ВодныйМИР, Спасатель, Поставка, МикроВода",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-title",
          "role": "section-title",
          "sectionId": "business_owners",
          "order": 37,
          "text": "Собственники бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "business_owners-0-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 38,
          "text": "ФИО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-0-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 39,
          "text": "Доставалова Ирина Антоновна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-1-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 40,
          "text": "Роль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-1-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 41,
          "text": "Учредитель, Конечный бенефициар",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-2-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 42,
          "text": "Доля",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-2-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 43,
          "text": "100%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-3-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 44,
          "text": "Пакет услуг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-3-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 45,
          "text": "СберПервый",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-4-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 46,
          "text": "Инсайт 1",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-4-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 47,
          "text": "Одна из богатейших женщин Красноярска — купила два\nгектара земли и офисы на Калинина за 260 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-5-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 48,
          "text": "Инсайт 2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-5-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 49,
          "text": "Увлекается садоводством",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-title",
          "role": "section-title",
          "sectionId": "financial_indicators",
          "order": 50,
          "text": "Финансовые показатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "financial_indicators-0-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 51,
          "text": "Выручка, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-0-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 52,
          "text": "2 946,9",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-1-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 53,
          "text": "Выручка, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-1-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 54,
          "text": "2 598,8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-2-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 55,
          "text": "Динамика выручки",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-2-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 56,
          "text": "-11,8%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-3-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 57,
          "text": "EBITDA, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-3-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 58,
          "text": "190",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-4-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 59,
          "text": "EBITDA, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-4-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 60,
          "text": "125",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-5-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 61,
          "text": "Динамика EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-5-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 62,
          "text": "-35%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-6-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 63,
          "text": "Чистая прибыль, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-6-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 64,
          "text": "106,4",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-7-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 65,
          "text": "Чистая прибыль, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2136,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-7-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 66,
          "text": "66,2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2168,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-8-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 67,
          "text": "Динамика чистой прибыли",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2200,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-8-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 68,
          "text": "-38%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2232,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-9-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 69,
          "text": "Долг, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2264,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-9-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 70,
          "text": "223",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2296,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-10-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 71,
          "text": "Долг, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2328,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-10-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 72,
          "text": "183",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2360,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-11-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 73,
          "text": "Динамика долга",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2392,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-11-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 74,
          "text": "-40 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2424,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-12-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 75,
          "text": "Долг/EBITDA, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2456,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-12-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 76,
          "text": "1,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2488,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-13-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 77,
          "text": "Долг/EBITDA, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2520,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-13-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 78,
          "text": "1,6",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2552,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-14-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 79,
          "text": "Динамика долг/EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2584,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-14-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 80,
          "text": "+0,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2616,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-15-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 81,
          "text": "Рентабельность продаж, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2648,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-15-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 82,
          "text": "3,6%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2680,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-16-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 83,
          "text": "Рентабельность продаж, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2712,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-16-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 84,
          "text": "2,5%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2744,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-17-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 85,
          "text": "Динамика рентабельности продаж",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2776,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-17-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 86,
          "text": "-1,1 п.п.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2808,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-18-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 87,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2840,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-18-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 88,
          "text": "Компания испытывает финансовые трудности:\nснизились выручка, EBITDA, чистая прибыль и\nрентабельность продаж; долговая нагрузка\nухудшилась несмотря на снижение долга на 40 млн\nруб. Рекомендуются меры по восстановлению\nустойчивости и конкурентоспособности.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2872,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-title",
          "role": "section-title",
          "sectionId": "cooperation",
          "order": 89,
          "text": "Сотрудничество",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2904,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "cooperation-0-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 90,
          "text": "Количество продуктов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2936,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-0-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 91,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2968,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-1-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 92,
          "text": "ОД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3000,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-1-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 93,
          "text": "35",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3032,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-2-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 94,
          "text": "ОД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3064,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-2-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 95,
          "text": "52",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3096,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-3-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 96,
          "text": "Динамика ОД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3128,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-3-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 97,
          "text": "+17; положительная динамика, общий доход вырос за\nсчёт НКД и активов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3160,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-4-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 98,
          "text": "СДО Активы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3192,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-4-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 99,
          "text": "1100",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3224,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-5-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 100,
          "text": "СДО Активы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3256,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-5-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 101,
          "text": "1 300",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3288,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-6-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 102,
          "text": "Динамика СДО Активы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3320,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-6-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 103,
          "text": "+200; рост может отражать расширение деятельности\nили вложения в новые проекты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3352,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-7-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 104,
          "text": "СДО Пассивы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3384,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-7-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 105,
          "text": "90",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3416,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-8-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 106,
          "text": "СДО Пассивы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3448,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-8-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 107,
          "text": "115",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3480,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-9-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 108,
          "text": "Динамика СДО Пассивы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3512,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-9-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 109,
          "text": "+30; база в основном за счёт овернайта, остатки\nнестабильны",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3544,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-10-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 110,
          "text": "ФОТ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3576,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-10-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 111,
          "text": "17",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3608,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-11-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 112,
          "text": "ФОТ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3640,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-11-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 113,
          "text": "14",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3672,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-12-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 114,
          "text": "Динамика ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3704,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-12-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 115,
          "text": "-3; снижение может указывать на оптимизацию\nпроцессов, сокращение персонала или повышение\nэффективности",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3736,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-13-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 116,
          "text": "НКД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3768,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-13-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 117,
          "text": "12",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3800,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-14-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 118,
          "text": "НКД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3832,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-14-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 119,
          "text": "15",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3864,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-15-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 120,
          "text": "Динамика НКД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3896,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-15-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 121,
          "text": "+3; прирост в основном за счёт эквайринга и\nинкассации",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3928,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-16-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 122,
          "text": "Экосистема, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3960,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-16-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 123,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3992,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-17-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 124,
          "text": "Экосистема, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4024,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-17-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 125,
          "text": "8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4056,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-18-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 126,
          "text": "Динамика экосистемы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4088,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-18-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 127,
          "text": "+1; представлены СберЗдоровье и СберМаркетинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-19-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 128,
          "text": "ПФИ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-19-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 129,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-20-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 130,
          "text": "ПФИ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-20-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 131,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-21-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 132,
          "text": "Динамика ПФИ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-21-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 133,
          "text": "-; активности в направлении мало",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-22-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 134,
          "text": "Уникальные получатели, Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-22-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 135,
          "text": "45 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-23-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 136,
          "text": "Уникальные получатели, Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-23-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 137,
          "text": "80 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-24-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 138,
          "text": "Динамика уникальных получателей",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-24-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 139,
          "text": "+35; позитивный сигнал расширения сотрудничества в\nчасти ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-title",
          "role": "section-title",
          "sectionId": "sber_share",
          "order": 140,
          "text": "Доля в Сбере",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "sber_share-0-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 141,
          "text": "Кошелёк, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-0-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 142,
          "text": "В Сбере 1250; в других банках 250; доля Сбера 83%;\nвсего 1500; банк-конкурент Открытие",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-1-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 143,
          "text": "Уникальные получатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-1-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 144,
          "text": "В Сбере 80; в других банках 10; доля Сбера 89%;\nвсего 90; конкуренты Открытие, ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-2-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 145,
          "text": "РКО, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-2-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 146,
          "text": "В Сбере 750; в других банках 250; доля Сбера 75%;\nвсего 1000; конкуренты Открытие, ВТБ,\nРайффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-3-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 147,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-3-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 148,
          "text": "В Сбере 400; в других банках 200; доля Сбера 67%;\nвсего 600; конкурент Райффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-4-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 149,
          "text": "ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-4-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 150,
          "text": "В Сбере 700; в других банках 400; доля Сбера 64%;\nвсего 1100; конкуренты Открытие, ТКБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-5-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 151,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-5-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 152,
          "text": "Есть несоответствие доли Сбера по сравнению с\nдолей в кредитном портфеле по РКО, эквайрингу и\nВЭД. Рекомендуется нарастить объёмы для достижения\nдоли 83%.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-title",
          "role": "section-title",
          "sectionId": "active_deals",
          "order": 153,
          "text": "Сделки в работе",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "active_deals-0-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 154,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-0-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 155,
          "text": "1 млрд руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-1-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 156,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-1-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 157,
          "text": "200 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-2-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 158,
          "text": "Инкассация",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-2-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 159,
          "text": "500 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-title",
          "role": "section-title",
          "sectionId": "potential",
          "order": 160,
          "text": "Потенциал",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "potential-0-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 161,
          "text": "Краткосрочное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-0-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 162,
          "text": "500 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-1-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 163,
          "text": "Телемедицина",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-1-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 164,
          "text": "5 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-title",
          "role": "section-title",
          "sectionId": "preapproved_offers",
          "order": 165,
          "text": "Предодобренные предложения",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "preapproved_offers-0-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 166,
          "text": "Оборотное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-0-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 167,
          "text": "ВКЛ на 100 млн рублей до 36 мес",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-1-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 168,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-1-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 169,
          "text": "Гарантии ИФНС на 500 млн руб до 12 мес;\nотклонение: верификация ОКК",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-title",
          "role": "section-title",
          "sectionId": "insights",
          "order": 170,
          "text": "Инсайты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "insights-0-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 171,
          "text": "Альфа-Банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-0-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 172,
          "text": "Эквайринг 1,5% против 1,7% у Сбера; бесплатные КСО\nс абонплатой 5 000 ₽",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-1-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 173,
          "text": "ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-1-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 174,
          "text": "Предложили эквайринг 1,7% без НДС",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-2-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 175,
          "text": "Открытие и ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-2-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 176,
          "text": "Уже занимают часть ФОТ и ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-3-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 177,
          "text": "Отношение клиента",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-3-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 178,
          "text": "Клиент называет зарплатный проект Сбера «скучным и\nневыгодным»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-title",
          "role": "section-title",
          "sectionId": "meeting_agreements",
          "order": 179,
          "text": "Договорённости с последней встречи",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "meeting_agreements-0-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 180,
          "text": "Поставщики",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-0-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 181,
          "text": "Поиск альтернативных поставщиков оборудования из\nИндии по сниженной цене",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-1-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 182,
          "text": "КСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-1-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 183,
          "text": "Консультация технических специалистов по внедрению\nКСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-2-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 184,
          "text": "Валютное хеджирование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-2-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 185,
          "text": "Предоставление информации и поддержки по валютному\nхеджированию",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-3-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 186,
          "text": "ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-3-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 187,
          "text": "Получение ясности по срокам кредита от ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "create-presentation",
          "role": "primary-action",
          "sectionId": "primary-action",
          "order": 188,
          "text": "Создать презентацию по справке",
          "copyId": "button_label",
          "action": null,
          "tone": "disabled",
          "layout": {
            "x": 24,
            "y": 6072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 17,
            "fontWeight": 700,
            "fill": "#ffffff"
          }
        },
        {
          "id": "generation-started",
          "role": "system-message",
          "sectionId": "messages",
          "order": 189,
          "text": "Формирование презентации началось в 13:24 и\nзаймет не более 20 минут. После завершения\nпрезентация будет направлена по электронной\nпочте в SIGMA и OMEGA.",
          "copyId": "generation_started_message",
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#5d687e"
          }
        },
        {
          "id": "composer-placeholder",
          "role": "composer-placeholder",
          "sectionId": "composer",
          "order": 190,
          "text": "Задайте любой вопрос…",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6136,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 400,
            "fill": "#9da6b8"
          }
        }
      ],
      "sourceSha256": "82d5e6d67cd62cae0f13cbd904e050aeaf70c24b84625bcef970b57c44021e39"
    },
    {
      "id": "lisa-presentation-chat-list",
      "kind": "phone",
      "phoneTime": "13:40",
      "initialScrollPosition": "top",
      "buttonState": "absent",
      "nodes": [
        {
          "id": "phone-status-time",
          "role": "status-time",
          "sectionId": "chrome",
          "order": 1,
          "text": "13:40",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 45,
            "y": 25,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 12,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "chat-list-favorites-heading",
          "role": "chat-list-heading",
          "sectionId": "favorites",
          "order": 2,
          "text": "Избранное",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 139,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-favorite-news",
          "role": "chat-list-entry",
          "sectionId": "favorites",
          "order": 3,
          "text": "Новости по АПК",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 177,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-favorite-financial-results",
          "role": "chat-list-entry",
          "sectionId": "favorites",
          "order": 4,
          "text": "Финансовые результаты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 215,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-favorite-uralskaya-stal",
          "role": "chat-list-entry",
          "sectionId": "favorites",
          "order": 5,
          "text": "Показатели Уралсеверстали",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 253,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-heading",
          "role": "chat-list-heading",
          "sectionId": "chat-list",
          "order": 6,
          "text": "Чаты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 307,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-today-heading",
          "role": "chat-list-period",
          "sectionId": "today",
          "order": 7,
          "text": "Сегодня",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 337,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 12,
            "fontWeight": 400,
            "fill": "#8a8ca3"
          }
        },
        {
          "id": "chat-list-current-client",
          "role": "chat-list-current-entry",
          "sectionId": "today",
          "order": 8,
          "text": "Справка по клиенту ООО «Водолей Трейд»",
          "copyId": null,
          "action": "return_to_same_chat",
          "tone": "selected",
          "layout": {
            "x": 24,
            "y": 361,
            "width": 345,
            "height": 42
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 600,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-recommended-products",
          "role": "chat-list-entry",
          "sectionId": "today",
          "order": 9,
          "text": "Рекомендованные продукты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 427,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-meeting-protocol",
          "role": "chat-list-entry",
          "sectionId": "today",
          "order": 10,
          "text": "Протокол встречи ООО «Мастеро…",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 473,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-meeting-preparation",
          "role": "chat-list-entry",
          "sectionId": "today",
          "order": 11,
          "text": "Подготовка к встрече ООО «Маст…",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 519,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-week-heading",
          "role": "chat-list-period",
          "sectionId": "week",
          "order": 12,
          "text": "На этой неделе",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 571,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 12,
            "fontWeight": 400,
            "fill": "#8a8ca3"
          }
        },
        {
          "id": "chat-list-price-calculation",
          "role": "chat-list-entry",
          "sectionId": "week",
          "order": 13,
          "text": "Расчёт цены",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 607,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-product-insights",
          "role": "chat-list-entry",
          "sectionId": "week",
          "order": 14,
          "text": "Продуктовые инсайты по ОАО Р…",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 653,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-psychological-portrait",
          "role": "chat-list-entry",
          "sectionId": "week",
          "order": 15,
          "text": "Психологический портрет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 699,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "chat-list-new-chat",
          "role": "chat-list-new-action",
          "sectionId": "fixed-action",
          "order": 16,
          "text": "Новый чат",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 56,
            "y": 778,
            "width": 281,
            "height": 48
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#ffffff"
          }
        }
      ],
      "sourceSha256": "4375c9a9a73cb1c59a45d3e83e21da1df0731d328676eadd7706794ce687fdf6"
    },
    {
      "id": "lisa-presentation-sent",
      "kind": "phone",
      "phoneTime": "13:40",
      "initialScrollPosition": "bottom",
      "buttonState": "disabled",
      "nodes": [
        {
          "id": "phone-status-time",
          "role": "status-time",
          "sectionId": "chrome",
          "order": 1,
          "text": "13:40",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 88,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 12,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "assistant-name",
          "role": "assistant-name",
          "sectionId": "chrome",
          "order": 2,
          "text": "Лиса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "reference-title",
          "role": "reference-title",
          "sectionId": "reference-header",
          "order": 3,
          "text": "Справка по клиенту ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 18,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "general_information-title",
          "role": "section-title",
          "sectionId": "general_information",
          "order": 4,
          "text": "Общая информация о клиенте",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "general_information-0-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 5,
          "text": "Сокращённое наименование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-0-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 6,
          "text": "ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-1-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 7,
          "text": "ИНН",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-1-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 8,
          "text": "2461004230",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-2-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 9,
          "text": "Клиентский менеджер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-2-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 10,
          "text": "Стручкова Елена Витальевна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-3-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 11,
          "text": "ТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-3-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 12,
          "text": "Сибирский банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-4-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 13,
          "text": "ГОСБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-4-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 14,
          "text": "Восточное отделение №8594",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-5-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 15,
          "text": "Сегмент",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-5-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 16,
          "text": "Средний",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-6-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 17,
          "text": "Приоритет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-6-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 18,
          "text": "А",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-7-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 19,
          "text": "Уровень доверия",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-7-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 20,
          "text": "Друг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-8-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 21,
          "text": "Холдинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-8-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 22,
          "text": "ГК «Водолей»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-9-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 23,
          "text": "Направление бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-9-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 24,
          "text": "Оптовая продажа сантехники, труб и отопительного\nоборудования в Сибири",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-10-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 25,
          "text": "Макроотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-10-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 26,
          "text": "Розничная торговля товарами выборочного спроса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-11-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 27,
          "text": "Подотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-11-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 28,
          "text": "Стройматериалы, товары для дома, ремонта, сада",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-12-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 29,
          "text": "Численность",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-12-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 30,
          "text": "90 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-13-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 31,
          "text": "Срок работы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-13-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 32,
          "text": "14 лет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-14-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 33,
          "text": "Конкуренты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-14-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 34,
          "text": "Водная компания, Компания X, Мега Вода, Вода PRO,\nВодаМастер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-15-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 35,
          "text": "Контрагенты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-15-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 36,
          "text": "ВодныйМИР, Спасатель, Поставка, МикроВода",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-title",
          "role": "section-title",
          "sectionId": "business_owners",
          "order": 37,
          "text": "Собственники бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "business_owners-0-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 38,
          "text": "ФИО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-0-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 39,
          "text": "Доставалова Ирина Антоновна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-1-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 40,
          "text": "Роль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-1-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 41,
          "text": "Учредитель, Конечный бенефициар",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-2-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 42,
          "text": "Доля",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-2-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 43,
          "text": "100%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-3-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 44,
          "text": "Пакет услуг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-3-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 45,
          "text": "СберПервый",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-4-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 46,
          "text": "Инсайт 1",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-4-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 47,
          "text": "Одна из богатейших женщин Красноярска — купила два\nгектара земли и офисы на Калинина за 260 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-5-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 48,
          "text": "Инсайт 2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-5-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 49,
          "text": "Увлекается садоводством",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-title",
          "role": "section-title",
          "sectionId": "financial_indicators",
          "order": 50,
          "text": "Финансовые показатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "financial_indicators-0-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 51,
          "text": "Выручка, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-0-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 52,
          "text": "2 946,9",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-1-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 53,
          "text": "Выручка, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-1-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 54,
          "text": "2 598,8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-2-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 55,
          "text": "Динамика выручки",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-2-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 56,
          "text": "-11,8%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-3-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 57,
          "text": "EBITDA, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-3-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 58,
          "text": "190",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-4-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 59,
          "text": "EBITDA, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-4-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 60,
          "text": "125",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-5-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 61,
          "text": "Динамика EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-5-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 62,
          "text": "-35%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-6-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 63,
          "text": "Чистая прибыль, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-6-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 64,
          "text": "106,4",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-7-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 65,
          "text": "Чистая прибыль, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2136,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-7-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 66,
          "text": "66,2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2168,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-8-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 67,
          "text": "Динамика чистой прибыли",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2200,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-8-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 68,
          "text": "-38%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2232,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-9-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 69,
          "text": "Долг, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2264,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-9-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 70,
          "text": "223",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2296,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-10-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 71,
          "text": "Долг, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2328,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-10-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 72,
          "text": "183",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2360,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-11-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 73,
          "text": "Динамика долга",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2392,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-11-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 74,
          "text": "-40 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2424,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-12-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 75,
          "text": "Долг/EBITDA, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2456,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-12-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 76,
          "text": "1,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2488,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-13-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 77,
          "text": "Долг/EBITDA, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2520,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-13-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 78,
          "text": "1,6",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2552,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-14-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 79,
          "text": "Динамика долг/EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2584,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-14-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 80,
          "text": "+0,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2616,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-15-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 81,
          "text": "Рентабельность продаж, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2648,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-15-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 82,
          "text": "3,6%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2680,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-16-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 83,
          "text": "Рентабельность продаж, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2712,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-16-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 84,
          "text": "2,5%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2744,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-17-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 85,
          "text": "Динамика рентабельности продаж",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2776,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-17-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 86,
          "text": "-1,1 п.п.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2808,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-18-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 87,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2840,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-18-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 88,
          "text": "Компания испытывает финансовые трудности:\nснизились выручка, EBITDA, чистая прибыль и\nрентабельность продаж; долговая нагрузка\nухудшилась несмотря на снижение долга на 40 млн\nруб. Рекомендуются меры по восстановлению\nустойчивости и конкурентоспособности.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2872,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-title",
          "role": "section-title",
          "sectionId": "cooperation",
          "order": 89,
          "text": "Сотрудничество",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2904,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "cooperation-0-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 90,
          "text": "Количество продуктов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2936,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-0-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 91,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2968,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-1-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 92,
          "text": "ОД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3000,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-1-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 93,
          "text": "35",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3032,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-2-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 94,
          "text": "ОД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3064,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-2-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 95,
          "text": "52",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3096,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-3-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 96,
          "text": "Динамика ОД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3128,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-3-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 97,
          "text": "+17; положительная динамика, общий доход вырос за\nсчёт НКД и активов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3160,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-4-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 98,
          "text": "СДО Активы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3192,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-4-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 99,
          "text": "1100",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3224,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-5-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 100,
          "text": "СДО Активы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3256,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-5-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 101,
          "text": "1 300",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3288,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-6-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 102,
          "text": "Динамика СДО Активы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3320,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-6-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 103,
          "text": "+200; рост может отражать расширение деятельности\nили вложения в новые проекты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3352,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-7-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 104,
          "text": "СДО Пассивы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3384,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-7-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 105,
          "text": "90",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3416,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-8-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 106,
          "text": "СДО Пассивы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3448,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-8-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 107,
          "text": "115",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3480,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-9-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 108,
          "text": "Динамика СДО Пассивы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3512,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-9-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 109,
          "text": "+30; база в основном за счёт овернайта, остатки\nнестабильны",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3544,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-10-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 110,
          "text": "ФОТ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3576,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-10-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 111,
          "text": "17",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3608,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-11-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 112,
          "text": "ФОТ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3640,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-11-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 113,
          "text": "14",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3672,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-12-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 114,
          "text": "Динамика ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3704,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-12-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 115,
          "text": "-3; снижение может указывать на оптимизацию\nпроцессов, сокращение персонала или повышение\nэффективности",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3736,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-13-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 116,
          "text": "НКД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3768,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-13-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 117,
          "text": "12",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3800,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-14-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 118,
          "text": "НКД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3832,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-14-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 119,
          "text": "15",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3864,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-15-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 120,
          "text": "Динамика НКД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3896,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-15-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 121,
          "text": "+3; прирост в основном за счёт эквайринга и\nинкассации",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3928,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-16-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 122,
          "text": "Экосистема, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3960,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-16-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 123,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3992,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-17-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 124,
          "text": "Экосистема, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4024,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-17-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 125,
          "text": "8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4056,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-18-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 126,
          "text": "Динамика экосистемы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4088,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-18-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 127,
          "text": "+1; представлены СберЗдоровье и СберМаркетинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-19-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 128,
          "text": "ПФИ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-19-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 129,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-20-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 130,
          "text": "ПФИ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-20-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 131,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-21-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 132,
          "text": "Динамика ПФИ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-21-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 133,
          "text": "-; активности в направлении мало",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-22-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 134,
          "text": "Уникальные получатели, Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-22-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 135,
          "text": "45 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-23-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 136,
          "text": "Уникальные получатели, Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-23-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 137,
          "text": "80 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-24-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 138,
          "text": "Динамика уникальных получателей",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-24-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 139,
          "text": "+35; позитивный сигнал расширения сотрудничества в\nчасти ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-title",
          "role": "section-title",
          "sectionId": "sber_share",
          "order": 140,
          "text": "Доля в Сбере",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "sber_share-0-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 141,
          "text": "Кошелёк, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-0-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 142,
          "text": "В Сбере 1250; в других банках 250; доля Сбера 83%;\nвсего 1500; банк-конкурент Открытие",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-1-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 143,
          "text": "Уникальные получатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-1-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 144,
          "text": "В Сбере 80; в других банках 10; доля Сбера 89%;\nвсего 90; конкуренты Открытие, ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-2-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 145,
          "text": "РКО, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-2-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 146,
          "text": "В Сбере 750; в других банках 250; доля Сбера 75%;\nвсего 1000; конкуренты Открытие, ВТБ,\nРайффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-3-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 147,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-3-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 148,
          "text": "В Сбере 400; в других банках 200; доля Сбера 67%;\nвсего 600; конкурент Райффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-4-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 149,
          "text": "ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-4-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 150,
          "text": "В Сбере 700; в других банках 400; доля Сбера 64%;\nвсего 1100; конкуренты Открытие, ТКБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-5-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 151,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-5-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 152,
          "text": "Есть несоответствие доли Сбера по сравнению с\nдолей в кредитном портфеле по РКО, эквайрингу и\nВЭД. Рекомендуется нарастить объёмы для достижения\nдоли 83%.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-title",
          "role": "section-title",
          "sectionId": "active_deals",
          "order": 153,
          "text": "Сделки в работе",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "active_deals-0-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 154,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-0-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 155,
          "text": "1 млрд руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-1-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 156,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-1-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 157,
          "text": "200 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-2-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 158,
          "text": "Инкассация",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-2-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 159,
          "text": "500 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-title",
          "role": "section-title",
          "sectionId": "potential",
          "order": 160,
          "text": "Потенциал",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "potential-0-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 161,
          "text": "Краткосрочное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-0-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 162,
          "text": "500 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-1-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 163,
          "text": "Телемедицина",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-1-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 164,
          "text": "5 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-title",
          "role": "section-title",
          "sectionId": "preapproved_offers",
          "order": 165,
          "text": "Предодобренные предложения",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "preapproved_offers-0-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 166,
          "text": "Оборотное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-0-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 167,
          "text": "ВКЛ на 100 млн рублей до 36 мес",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-1-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 168,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-1-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 169,
          "text": "Гарантии ИФНС на 500 млн руб до 12 мес;\nотклонение: верификация ОКК",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-title",
          "role": "section-title",
          "sectionId": "insights",
          "order": 170,
          "text": "Инсайты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "insights-0-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 171,
          "text": "Альфа-Банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-0-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 172,
          "text": "Эквайринг 1,5% против 1,7% у Сбера; бесплатные КСО\nс абонплатой 5 000 ₽",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-1-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 173,
          "text": "ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-1-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 174,
          "text": "Предложили эквайринг 1,7% без НДС",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-2-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 175,
          "text": "Открытие и ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-2-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 176,
          "text": "Уже занимают часть ФОТ и ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-3-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 177,
          "text": "Отношение клиента",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-3-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 178,
          "text": "Клиент называет зарплатный проект Сбера «скучным и\nневыгодным»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-title",
          "role": "section-title",
          "sectionId": "meeting_agreements",
          "order": 179,
          "text": "Договорённости с последней встречи",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "meeting_agreements-0-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 180,
          "text": "Поставщики",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-0-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 181,
          "text": "Поиск альтернативных поставщиков оборудования из\nИндии по сниженной цене",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-1-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 182,
          "text": "КСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-1-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 183,
          "text": "Консультация технических специалистов по внедрению\nКСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-2-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 184,
          "text": "Валютное хеджирование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-2-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 185,
          "text": "Предоставление информации и поддержки по валютному\nхеджированию",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-3-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 186,
          "text": "ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-3-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 187,
          "text": "Получение ясности по срокам кредита от ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "create-presentation",
          "role": "primary-action",
          "sectionId": "primary-action",
          "order": 188,
          "text": "Создать презентацию по справке",
          "copyId": "button_label",
          "action": null,
          "tone": "disabled",
          "layout": {
            "x": 24,
            "y": 6072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 17,
            "fontWeight": 700,
            "fill": "#ffffff"
          }
        },
        {
          "id": "generation-started",
          "role": "system-message",
          "sectionId": "messages",
          "order": 189,
          "text": "Формирование презентации началось в 13:24 и\nзаймет не более 20 минут. После завершения\nпрезентация будет направлена по электронной\nпочте в SIGMA и OMEGA.",
          "copyId": "generation_started_message",
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#5d687e"
          }
        },
        {
          "id": "delivery-success",
          "role": "success-message",
          "sectionId": "messages",
          "order": 190,
          "text": "Презентация готова и направлена по\nэлектронной почте в 13:40.",
          "copyId": "delivery_success_message",
          "action": "open_delivery_email",
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6136,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#5d687e"
          }
        },
        {
          "id": "composer-placeholder",
          "role": "composer-placeholder",
          "sectionId": "composer",
          "order": 191,
          "text": "Задайте любой вопрос…",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6168,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 400,
            "fill": "#9da6b8"
          }
        }
      ],
      "sourceSha256": "4bb8e5083ac37cfa0dd73f7d8da49d86eeb184beb5df90bd5008d19c7b729c48"
    },
    {
      "id": "lisa-order-not-accepted",
      "kind": "phone",
      "phoneTime": "13:40",
      "initialScrollPosition": "bottom",
      "buttonState": "disabled",
      "nodes": [
        {
          "id": "phone-status-time",
          "role": "status-time",
          "sectionId": "chrome",
          "order": 1,
          "text": "13:40",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 88,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 12,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "assistant-name",
          "role": "assistant-name",
          "sectionId": "chrome",
          "order": 2,
          "text": "Лиса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "reference-title",
          "role": "reference-title",
          "sectionId": "reference-header",
          "order": 3,
          "text": "Справка по клиенту ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 18,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "general_information-title",
          "role": "section-title",
          "sectionId": "general_information",
          "order": 4,
          "text": "Общая информация о клиенте",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "general_information-0-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 5,
          "text": "Сокращённое наименование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-0-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 6,
          "text": "ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-1-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 7,
          "text": "ИНН",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-1-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 8,
          "text": "2461004230",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-2-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 9,
          "text": "Клиентский менеджер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-2-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 10,
          "text": "Стручкова Елена Витальевна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-3-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 11,
          "text": "ТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-3-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 12,
          "text": "Сибирский банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-4-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 13,
          "text": "ГОСБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-4-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 14,
          "text": "Восточное отделение №8594",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-5-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 15,
          "text": "Сегмент",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-5-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 16,
          "text": "Средний",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-6-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 17,
          "text": "Приоритет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-6-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 18,
          "text": "А",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-7-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 19,
          "text": "Уровень доверия",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-7-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 20,
          "text": "Друг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-8-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 21,
          "text": "Холдинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-8-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 22,
          "text": "ГК «Водолей»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-9-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 23,
          "text": "Направление бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-9-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 24,
          "text": "Оптовая продажа сантехники, труб и отопительного\nоборудования в Сибири",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-10-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 25,
          "text": "Макроотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-10-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 26,
          "text": "Розничная торговля товарами выборочного спроса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-11-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 27,
          "text": "Подотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-11-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 28,
          "text": "Стройматериалы, товары для дома, ремонта, сада",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-12-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 29,
          "text": "Численность",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-12-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 30,
          "text": "90 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-13-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 31,
          "text": "Срок работы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-13-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 32,
          "text": "14 лет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-14-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 33,
          "text": "Конкуренты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-14-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 34,
          "text": "Водная компания, Компания X, Мега Вода, Вода PRO,\nВодаМастер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-15-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 35,
          "text": "Контрагенты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-15-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 36,
          "text": "ВодныйМИР, Спасатель, Поставка, МикроВода",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-title",
          "role": "section-title",
          "sectionId": "business_owners",
          "order": 37,
          "text": "Собственники бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "business_owners-0-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 38,
          "text": "ФИО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-0-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 39,
          "text": "Доставалова Ирина Антоновна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-1-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 40,
          "text": "Роль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-1-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 41,
          "text": "Учредитель, Конечный бенефициар",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-2-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 42,
          "text": "Доля",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-2-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 43,
          "text": "100%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-3-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 44,
          "text": "Пакет услуг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-3-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 45,
          "text": "СберПервый",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-4-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 46,
          "text": "Инсайт 1",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-4-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 47,
          "text": "Одна из богатейших женщин Красноярска — купила два\nгектара земли и офисы на Калинина за 260 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-5-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 48,
          "text": "Инсайт 2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-5-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 49,
          "text": "Увлекается садоводством",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-title",
          "role": "section-title",
          "sectionId": "financial_indicators",
          "order": 50,
          "text": "Финансовые показатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "financial_indicators-0-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 51,
          "text": "Выручка, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-0-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 52,
          "text": "2 946,9",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-1-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 53,
          "text": "Выручка, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-1-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 54,
          "text": "2 598,8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-2-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 55,
          "text": "Динамика выручки",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-2-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 56,
          "text": "-11,8%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-3-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 57,
          "text": "EBITDA, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-3-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 58,
          "text": "190",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-4-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 59,
          "text": "EBITDA, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-4-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 60,
          "text": "125",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-5-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 61,
          "text": "Динамика EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-5-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 62,
          "text": "-35%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-6-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 63,
          "text": "Чистая прибыль, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-6-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 64,
          "text": "106,4",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-7-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 65,
          "text": "Чистая прибыль, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2136,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-7-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 66,
          "text": "66,2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2168,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-8-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 67,
          "text": "Динамика чистой прибыли",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2200,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-8-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 68,
          "text": "-38%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2232,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-9-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 69,
          "text": "Долг, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2264,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-9-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 70,
          "text": "223",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2296,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-10-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 71,
          "text": "Долг, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2328,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-10-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 72,
          "text": "183",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2360,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-11-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 73,
          "text": "Динамика долга",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2392,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-11-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 74,
          "text": "-40 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2424,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-12-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 75,
          "text": "Долг/EBITDA, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2456,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-12-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 76,
          "text": "1,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2488,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-13-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 77,
          "text": "Долг/EBITDA, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2520,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-13-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 78,
          "text": "1,6",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2552,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-14-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 79,
          "text": "Динамика долг/EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2584,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-14-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 80,
          "text": "+0,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2616,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-15-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 81,
          "text": "Рентабельность продаж, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2648,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-15-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 82,
          "text": "3,6%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2680,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-16-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 83,
          "text": "Рентабельность продаж, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2712,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-16-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 84,
          "text": "2,5%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2744,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-17-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 85,
          "text": "Динамика рентабельности продаж",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2776,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-17-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 86,
          "text": "-1,1 п.п.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2808,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-18-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 87,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2840,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-18-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 88,
          "text": "Компания испытывает финансовые трудности:\nснизились выручка, EBITDA, чистая прибыль и\nрентабельность продаж; долговая нагрузка\nухудшилась несмотря на снижение долга на 40 млн\nруб. Рекомендуются меры по восстановлению\nустойчивости и конкурентоспособности.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2872,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-title",
          "role": "section-title",
          "sectionId": "cooperation",
          "order": 89,
          "text": "Сотрудничество",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2904,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "cooperation-0-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 90,
          "text": "Количество продуктов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2936,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-0-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 91,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2968,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-1-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 92,
          "text": "ОД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3000,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-1-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 93,
          "text": "35",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3032,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-2-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 94,
          "text": "ОД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3064,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-2-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 95,
          "text": "52",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3096,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-3-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 96,
          "text": "Динамика ОД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3128,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-3-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 97,
          "text": "+17; положительная динамика, общий доход вырос за\nсчёт НКД и активов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3160,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-4-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 98,
          "text": "СДО Активы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3192,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-4-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 99,
          "text": "1100",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3224,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-5-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 100,
          "text": "СДО Активы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3256,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-5-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 101,
          "text": "1 300",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3288,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-6-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 102,
          "text": "Динамика СДО Активы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3320,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-6-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 103,
          "text": "+200; рост может отражать расширение деятельности\nили вложения в новые проекты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3352,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-7-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 104,
          "text": "СДО Пассивы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3384,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-7-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 105,
          "text": "90",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3416,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-8-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 106,
          "text": "СДО Пассивы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3448,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-8-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 107,
          "text": "115",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3480,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-9-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 108,
          "text": "Динамика СДО Пассивы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3512,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-9-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 109,
          "text": "+30; база в основном за счёт овернайта, остатки\nнестабильны",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3544,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-10-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 110,
          "text": "ФОТ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3576,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-10-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 111,
          "text": "17",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3608,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-11-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 112,
          "text": "ФОТ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3640,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-11-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 113,
          "text": "14",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3672,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-12-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 114,
          "text": "Динамика ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3704,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-12-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 115,
          "text": "-3; снижение может указывать на оптимизацию\nпроцессов, сокращение персонала или повышение\nэффективности",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3736,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-13-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 116,
          "text": "НКД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3768,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-13-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 117,
          "text": "12",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3800,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-14-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 118,
          "text": "НКД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3832,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-14-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 119,
          "text": "15",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3864,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-15-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 120,
          "text": "Динамика НКД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3896,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-15-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 121,
          "text": "+3; прирост в основном за счёт эквайринга и\nинкассации",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3928,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-16-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 122,
          "text": "Экосистема, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3960,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-16-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 123,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3992,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-17-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 124,
          "text": "Экосистема, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4024,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-17-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 125,
          "text": "8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4056,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-18-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 126,
          "text": "Динамика экосистемы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4088,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-18-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 127,
          "text": "+1; представлены СберЗдоровье и СберМаркетинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-19-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 128,
          "text": "ПФИ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-19-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 129,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-20-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 130,
          "text": "ПФИ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-20-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 131,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-21-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 132,
          "text": "Динамика ПФИ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-21-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 133,
          "text": "-; активности в направлении мало",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-22-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 134,
          "text": "Уникальные получатели, Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-22-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 135,
          "text": "45 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-23-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 136,
          "text": "Уникальные получатели, Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-23-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 137,
          "text": "80 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-24-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 138,
          "text": "Динамика уникальных получателей",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-24-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 139,
          "text": "+35; позитивный сигнал расширения сотрудничества в\nчасти ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-title",
          "role": "section-title",
          "sectionId": "sber_share",
          "order": 140,
          "text": "Доля в Сбере",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "sber_share-0-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 141,
          "text": "Кошелёк, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-0-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 142,
          "text": "В Сбере 1250; в других банках 250; доля Сбера 83%;\nвсего 1500; банк-конкурент Открытие",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-1-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 143,
          "text": "Уникальные получатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-1-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 144,
          "text": "В Сбере 80; в других банках 10; доля Сбера 89%;\nвсего 90; конкуренты Открытие, ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-2-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 145,
          "text": "РКО, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-2-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 146,
          "text": "В Сбере 750; в других банках 250; доля Сбера 75%;\nвсего 1000; конкуренты Открытие, ВТБ,\nРайффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-3-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 147,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-3-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 148,
          "text": "В Сбере 400; в других банках 200; доля Сбера 67%;\nвсего 600; конкурент Райффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-4-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 149,
          "text": "ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-4-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 150,
          "text": "В Сбере 700; в других банках 400; доля Сбера 64%;\nвсего 1100; конкуренты Открытие, ТКБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-5-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 151,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-5-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 152,
          "text": "Есть несоответствие доли Сбера по сравнению с\nдолей в кредитном портфеле по РКО, эквайрингу и\nВЭД. Рекомендуется нарастить объёмы для достижения\nдоли 83%.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-title",
          "role": "section-title",
          "sectionId": "active_deals",
          "order": 153,
          "text": "Сделки в работе",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "active_deals-0-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 154,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-0-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 155,
          "text": "1 млрд руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-1-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 156,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-1-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 157,
          "text": "200 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-2-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 158,
          "text": "Инкассация",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-2-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 159,
          "text": "500 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-title",
          "role": "section-title",
          "sectionId": "potential",
          "order": 160,
          "text": "Потенциал",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "potential-0-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 161,
          "text": "Краткосрочное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-0-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 162,
          "text": "500 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-1-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 163,
          "text": "Телемедицина",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-1-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 164,
          "text": "5 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-title",
          "role": "section-title",
          "sectionId": "preapproved_offers",
          "order": 165,
          "text": "Предодобренные предложения",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "preapproved_offers-0-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 166,
          "text": "Оборотное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-0-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 167,
          "text": "ВКЛ на 100 млн рублей до 36 мес",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-1-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 168,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-1-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 169,
          "text": "Гарантии ИФНС на 500 млн руб до 12 мес;\nотклонение: верификация ОКК",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-title",
          "role": "section-title",
          "sectionId": "insights",
          "order": 170,
          "text": "Инсайты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "insights-0-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 171,
          "text": "Альфа-Банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-0-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 172,
          "text": "Эквайринг 1,5% против 1,7% у Сбера; бесплатные КСО\nс абонплатой 5 000 ₽",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-1-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 173,
          "text": "ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-1-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 174,
          "text": "Предложили эквайринг 1,7% без НДС",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-2-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 175,
          "text": "Открытие и ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-2-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 176,
          "text": "Уже занимают часть ФОТ и ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-3-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 177,
          "text": "Отношение клиента",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-3-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 178,
          "text": "Клиент называет зарплатный проект Сбера «скучным и\nневыгодным»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-title",
          "role": "section-title",
          "sectionId": "meeting_agreements",
          "order": 179,
          "text": "Договорённости с последней встречи",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "meeting_agreements-0-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 180,
          "text": "Поставщики",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-0-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 181,
          "text": "Поиск альтернативных поставщиков оборудования из\nИндии по сниженной цене",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-1-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 182,
          "text": "КСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-1-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 183,
          "text": "Консультация технических специалистов по внедрению\nКСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-2-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 184,
          "text": "Валютное хеджирование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-2-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 185,
          "text": "Предоставление информации и поддержки по валютному\nхеджированию",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-3-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 186,
          "text": "ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-3-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 187,
          "text": "Получение ясности по срокам кредита от ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "create-presentation",
          "role": "primary-action",
          "sectionId": "primary-action",
          "order": 188,
          "text": "Создать презентацию по справке",
          "copyId": "button_label",
          "action": null,
          "tone": "disabled",
          "layout": {
            "x": 24,
            "y": 6072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 17,
            "fontWeight": 700,
            "fill": "#ffffff"
          }
        },
        {
          "id": "order-not-accepted",
          "role": "error-message",
          "sectionId": "messages",
          "order": 189,
          "text": "Не удалось принять данные для формирования\nпрезентации. Вернитесь к диалогу «Справка\nпо клиенту» и уточните данные, либо\nоформите тикет в сопровождение.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#5d687e"
          }
        },
        {
          "id": "composer-placeholder",
          "role": "composer-placeholder",
          "sectionId": "composer",
          "order": 190,
          "text": "Задайте любой вопрос…",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6136,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 400,
            "fill": "#9da6b8"
          }
        }
      ],
      "sourceSha256": "725fc101edbe81b66f0761064faa2639d4007a4c4cabea81cf0e8a197d9a77a6"
    },
    {
      "id": "lisa-delivery-delayed",
      "kind": "phone",
      "phoneTime": "13:40",
      "initialScrollPosition": "bottom",
      "buttonState": "disabled",
      "nodes": [
        {
          "id": "phone-status-time",
          "role": "status-time",
          "sectionId": "chrome",
          "order": 1,
          "text": "13:40",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 88,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 12,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "assistant-name",
          "role": "assistant-name",
          "sectionId": "chrome",
          "order": 2,
          "text": "Лиса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "reference-title",
          "role": "reference-title",
          "sectionId": "reference-header",
          "order": 3,
          "text": "Справка по клиенту ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 18,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "general_information-title",
          "role": "section-title",
          "sectionId": "general_information",
          "order": 4,
          "text": "Общая информация о клиенте",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "general_information-0-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 5,
          "text": "Сокращённое наименование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-0-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 6,
          "text": "ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-1-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 7,
          "text": "ИНН",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-1-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 8,
          "text": "2461004230",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-2-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 9,
          "text": "Клиентский менеджер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-2-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 10,
          "text": "Стручкова Елена Витальевна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-3-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 11,
          "text": "ТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-3-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 12,
          "text": "Сибирский банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-4-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 13,
          "text": "ГОСБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-4-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 14,
          "text": "Восточное отделение №8594",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-5-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 15,
          "text": "Сегмент",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-5-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 16,
          "text": "Средний",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-6-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 17,
          "text": "Приоритет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-6-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 18,
          "text": "А",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-7-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 19,
          "text": "Уровень доверия",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-7-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 20,
          "text": "Друг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-8-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 21,
          "text": "Холдинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-8-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 22,
          "text": "ГК «Водолей»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-9-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 23,
          "text": "Направление бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-9-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 24,
          "text": "Оптовая продажа сантехники, труб и отопительного\nоборудования в Сибири",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-10-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 25,
          "text": "Макроотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-10-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 26,
          "text": "Розничная торговля товарами выборочного спроса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-11-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 27,
          "text": "Подотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-11-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 28,
          "text": "Стройматериалы, товары для дома, ремонта, сада",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-12-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 29,
          "text": "Численность",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-12-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 30,
          "text": "90 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-13-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 31,
          "text": "Срок работы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-13-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 32,
          "text": "14 лет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-14-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 33,
          "text": "Конкуренты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-14-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 34,
          "text": "Водная компания, Компания X, Мега Вода, Вода PRO,\nВодаМастер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-15-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 35,
          "text": "Контрагенты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-15-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 36,
          "text": "ВодныйМИР, Спасатель, Поставка, МикроВода",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-title",
          "role": "section-title",
          "sectionId": "business_owners",
          "order": 37,
          "text": "Собственники бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "business_owners-0-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 38,
          "text": "ФИО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-0-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 39,
          "text": "Доставалова Ирина Антоновна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-1-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 40,
          "text": "Роль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-1-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 41,
          "text": "Учредитель, Конечный бенефициар",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-2-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 42,
          "text": "Доля",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-2-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 43,
          "text": "100%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-3-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 44,
          "text": "Пакет услуг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-3-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 45,
          "text": "СберПервый",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-4-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 46,
          "text": "Инсайт 1",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-4-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 47,
          "text": "Одна из богатейших женщин Красноярска — купила два\nгектара земли и офисы на Калинина за 260 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-5-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 48,
          "text": "Инсайт 2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-5-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 49,
          "text": "Увлекается садоводством",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-title",
          "role": "section-title",
          "sectionId": "financial_indicators",
          "order": 50,
          "text": "Финансовые показатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "financial_indicators-0-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 51,
          "text": "Выручка, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-0-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 52,
          "text": "2 946,9",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-1-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 53,
          "text": "Выручка, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-1-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 54,
          "text": "2 598,8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-2-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 55,
          "text": "Динамика выручки",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-2-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 56,
          "text": "-11,8%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-3-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 57,
          "text": "EBITDA, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-3-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 58,
          "text": "190",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-4-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 59,
          "text": "EBITDA, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-4-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 60,
          "text": "125",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-5-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 61,
          "text": "Динамика EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-5-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 62,
          "text": "-35%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-6-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 63,
          "text": "Чистая прибыль, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-6-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 64,
          "text": "106,4",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-7-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 65,
          "text": "Чистая прибыль, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2136,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-7-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 66,
          "text": "66,2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2168,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-8-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 67,
          "text": "Динамика чистой прибыли",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2200,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-8-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 68,
          "text": "-38%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2232,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-9-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 69,
          "text": "Долг, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2264,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-9-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 70,
          "text": "223",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2296,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-10-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 71,
          "text": "Долг, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2328,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-10-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 72,
          "text": "183",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2360,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-11-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 73,
          "text": "Динамика долга",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2392,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-11-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 74,
          "text": "-40 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2424,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-12-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 75,
          "text": "Долг/EBITDA, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2456,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-12-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 76,
          "text": "1,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2488,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-13-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 77,
          "text": "Долг/EBITDA, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2520,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-13-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 78,
          "text": "1,6",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2552,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-14-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 79,
          "text": "Динамика долг/EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2584,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-14-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 80,
          "text": "+0,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2616,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-15-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 81,
          "text": "Рентабельность продаж, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2648,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-15-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 82,
          "text": "3,6%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2680,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-16-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 83,
          "text": "Рентабельность продаж, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2712,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-16-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 84,
          "text": "2,5%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2744,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-17-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 85,
          "text": "Динамика рентабельности продаж",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2776,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-17-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 86,
          "text": "-1,1 п.п.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2808,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-18-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 87,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2840,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-18-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 88,
          "text": "Компания испытывает финансовые трудности:\nснизились выручка, EBITDA, чистая прибыль и\nрентабельность продаж; долговая нагрузка\nухудшилась несмотря на снижение долга на 40 млн\nруб. Рекомендуются меры по восстановлению\nустойчивости и конкурентоспособности.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2872,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-title",
          "role": "section-title",
          "sectionId": "cooperation",
          "order": 89,
          "text": "Сотрудничество",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2904,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "cooperation-0-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 90,
          "text": "Количество продуктов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2936,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-0-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 91,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2968,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-1-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 92,
          "text": "ОД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3000,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-1-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 93,
          "text": "35",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3032,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-2-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 94,
          "text": "ОД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3064,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-2-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 95,
          "text": "52",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3096,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-3-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 96,
          "text": "Динамика ОД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3128,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-3-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 97,
          "text": "+17; положительная динамика, общий доход вырос за\nсчёт НКД и активов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3160,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-4-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 98,
          "text": "СДО Активы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3192,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-4-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 99,
          "text": "1100",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3224,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-5-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 100,
          "text": "СДО Активы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3256,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-5-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 101,
          "text": "1 300",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3288,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-6-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 102,
          "text": "Динамика СДО Активы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3320,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-6-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 103,
          "text": "+200; рост может отражать расширение деятельности\nили вложения в новые проекты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3352,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-7-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 104,
          "text": "СДО Пассивы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3384,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-7-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 105,
          "text": "90",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3416,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-8-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 106,
          "text": "СДО Пассивы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3448,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-8-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 107,
          "text": "115",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3480,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-9-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 108,
          "text": "Динамика СДО Пассивы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3512,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-9-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 109,
          "text": "+30; база в основном за счёт овернайта, остатки\nнестабильны",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3544,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-10-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 110,
          "text": "ФОТ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3576,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-10-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 111,
          "text": "17",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3608,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-11-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 112,
          "text": "ФОТ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3640,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-11-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 113,
          "text": "14",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3672,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-12-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 114,
          "text": "Динамика ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3704,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-12-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 115,
          "text": "-3; снижение может указывать на оптимизацию\nпроцессов, сокращение персонала или повышение\nэффективности",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3736,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-13-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 116,
          "text": "НКД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3768,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-13-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 117,
          "text": "12",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3800,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-14-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 118,
          "text": "НКД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3832,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-14-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 119,
          "text": "15",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3864,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-15-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 120,
          "text": "Динамика НКД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3896,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-15-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 121,
          "text": "+3; прирост в основном за счёт эквайринга и\nинкассации",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3928,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-16-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 122,
          "text": "Экосистема, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3960,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-16-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 123,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3992,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-17-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 124,
          "text": "Экосистема, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4024,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-17-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 125,
          "text": "8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4056,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-18-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 126,
          "text": "Динамика экосистемы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4088,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-18-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 127,
          "text": "+1; представлены СберЗдоровье и СберМаркетинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-19-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 128,
          "text": "ПФИ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-19-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 129,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-20-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 130,
          "text": "ПФИ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-20-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 131,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-21-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 132,
          "text": "Динамика ПФИ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-21-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 133,
          "text": "-; активности в направлении мало",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-22-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 134,
          "text": "Уникальные получатели, Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-22-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 135,
          "text": "45 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-23-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 136,
          "text": "Уникальные получатели, Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-23-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 137,
          "text": "80 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-24-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 138,
          "text": "Динамика уникальных получателей",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-24-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 139,
          "text": "+35; позитивный сигнал расширения сотрудничества в\nчасти ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-title",
          "role": "section-title",
          "sectionId": "sber_share",
          "order": 140,
          "text": "Доля в Сбере",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "sber_share-0-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 141,
          "text": "Кошелёк, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-0-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 142,
          "text": "В Сбере 1250; в других банках 250; доля Сбера 83%;\nвсего 1500; банк-конкурент Открытие",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-1-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 143,
          "text": "Уникальные получатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-1-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 144,
          "text": "В Сбере 80; в других банках 10; доля Сбера 89%;\nвсего 90; конкуренты Открытие, ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-2-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 145,
          "text": "РКО, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-2-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 146,
          "text": "В Сбере 750; в других банках 250; доля Сбера 75%;\nвсего 1000; конкуренты Открытие, ВТБ,\nРайффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-3-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 147,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-3-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 148,
          "text": "В Сбере 400; в других банках 200; доля Сбера 67%;\nвсего 600; конкурент Райффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-4-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 149,
          "text": "ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-4-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 150,
          "text": "В Сбере 700; в других банках 400; доля Сбера 64%;\nвсего 1100; конкуренты Открытие, ТКБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-5-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 151,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-5-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 152,
          "text": "Есть несоответствие доли Сбера по сравнению с\nдолей в кредитном портфеле по РКО, эквайрингу и\nВЭД. Рекомендуется нарастить объёмы для достижения\nдоли 83%.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-title",
          "role": "section-title",
          "sectionId": "active_deals",
          "order": 153,
          "text": "Сделки в работе",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "active_deals-0-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 154,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-0-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 155,
          "text": "1 млрд руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-1-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 156,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-1-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 157,
          "text": "200 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-2-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 158,
          "text": "Инкассация",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-2-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 159,
          "text": "500 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-title",
          "role": "section-title",
          "sectionId": "potential",
          "order": 160,
          "text": "Потенциал",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "potential-0-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 161,
          "text": "Краткосрочное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-0-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 162,
          "text": "500 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-1-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 163,
          "text": "Телемедицина",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-1-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 164,
          "text": "5 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-title",
          "role": "section-title",
          "sectionId": "preapproved_offers",
          "order": 165,
          "text": "Предодобренные предложения",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "preapproved_offers-0-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 166,
          "text": "Оборотное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-0-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 167,
          "text": "ВКЛ на 100 млн рублей до 36 мес",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-1-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 168,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-1-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 169,
          "text": "Гарантии ИФНС на 500 млн руб до 12 мес;\nотклонение: верификация ОКК",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-title",
          "role": "section-title",
          "sectionId": "insights",
          "order": 170,
          "text": "Инсайты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "insights-0-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 171,
          "text": "Альфа-Банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-0-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 172,
          "text": "Эквайринг 1,5% против 1,7% у Сбера; бесплатные КСО\nс абонплатой 5 000 ₽",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-1-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 173,
          "text": "ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-1-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 174,
          "text": "Предложили эквайринг 1,7% без НДС",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-2-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 175,
          "text": "Открытие и ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-2-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 176,
          "text": "Уже занимают часть ФОТ и ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-3-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 177,
          "text": "Отношение клиента",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-3-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 178,
          "text": "Клиент называет зарплатный проект Сбера «скучным и\nневыгодным»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-title",
          "role": "section-title",
          "sectionId": "meeting_agreements",
          "order": 179,
          "text": "Договорённости с последней встречи",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "meeting_agreements-0-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 180,
          "text": "Поставщики",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-0-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 181,
          "text": "Поиск альтернативных поставщиков оборудования из\nИндии по сниженной цене",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-1-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 182,
          "text": "КСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-1-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 183,
          "text": "Консультация технических специалистов по внедрению\nКСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-2-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 184,
          "text": "Валютное хеджирование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-2-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 185,
          "text": "Предоставление информации и поддержки по валютному\nхеджированию",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-3-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 186,
          "text": "ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-3-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 187,
          "text": "Получение ясности по срокам кредита от ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "create-presentation",
          "role": "primary-action",
          "sectionId": "primary-action",
          "order": 188,
          "text": "Создать презентацию по справке",
          "copyId": "button_label",
          "action": null,
          "tone": "disabled",
          "layout": {
            "x": 24,
            "y": 6072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 17,
            "fontWeight": 700,
            "fill": "#ffffff"
          }
        },
        {
          "id": "generation-started",
          "role": "system-message",
          "sectionId": "messages",
          "order": 189,
          "text": "Формирование презентации началось в 13:24 и\nзаймет не более 20 минут. После завершения\nпрезентация будет направлена по электронной\nпочте в SIGMA и OMEGA.",
          "copyId": "generation_started_message",
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#5d687e"
          }
        },
        {
          "id": "delivery-delayed",
          "role": "error-message",
          "sectionId": "messages",
          "order": 190,
          "text": "Отправка презентации в SIGMA задерживается.\nВ течение часа будут выполнены повторные\nпопытки. Сообщу здесь, если отправка будет\nподтверждена.",
          "copyId": "sigma_delivery_delayed_message",
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6136,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#5d687e"
          }
        },
        {
          "id": "composer-placeholder",
          "role": "composer-placeholder",
          "sectionId": "composer",
          "order": 191,
          "text": "Задайте любой вопрос…",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6168,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 400,
            "fill": "#9da6b8"
          }
        }
      ],
      "sourceSha256": "8aa919881a7cf3f115d94dbf0e47a017d073f0b4e573de5839b180a6927c3e09"
    },
    {
      "id": "lisa-delivery-partial",
      "kind": "phone",
      "phoneTime": "13:40",
      "initialScrollPosition": "bottom",
      "buttonState": "disabled",
      "nodes": [
        {
          "id": "phone-status-time",
          "role": "status-time",
          "sectionId": "chrome",
          "order": 1,
          "text": "13:40",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 88,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 12,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "assistant-name",
          "role": "assistant-name",
          "sectionId": "chrome",
          "order": 2,
          "text": "Лиса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "reference-title",
          "role": "reference-title",
          "sectionId": "reference-header",
          "order": 3,
          "text": "Справка по клиенту ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 18,
            "fontWeight": 700,
            "fill": "#1f2633"
          }
        },
        {
          "id": "general_information-title",
          "role": "section-title",
          "sectionId": "general_information",
          "order": 4,
          "text": "Общая информация о клиенте",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "general_information-0-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 5,
          "text": "Сокращённое наименование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-0-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 6,
          "text": "ООО «Водолей Трейд»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-1-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 7,
          "text": "ИНН",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-1-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 8,
          "text": "2461004230",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-2-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 9,
          "text": "Клиентский менеджер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-2-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 10,
          "text": "Стручкова Елена Витальевна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-3-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 11,
          "text": "ТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-3-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 12,
          "text": "Сибирский банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-4-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 13,
          "text": "ГОСБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-4-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 14,
          "text": "Восточное отделение №8594",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-5-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 15,
          "text": "Сегмент",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-5-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 16,
          "text": "Средний",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-6-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 17,
          "text": "Приоритет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-6-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 18,
          "text": "А",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-7-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 19,
          "text": "Уровень доверия",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-7-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 20,
          "text": "Друг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-8-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 21,
          "text": "Холдинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-8-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 22,
          "text": "ГК «Водолей»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-9-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 23,
          "text": "Направление бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-9-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 24,
          "text": "Оптовая продажа сантехники, труб и отопительного\nоборудования в Сибири",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-10-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 25,
          "text": "Макроотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-10-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 26,
          "text": "Розничная торговля товарами выборочного спроса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-11-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 27,
          "text": "Подотрасль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-11-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 28,
          "text": "Стройматериалы, товары для дома, ремонта, сада",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-12-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 29,
          "text": "Численность",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-12-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 30,
          "text": "90 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-13-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 31,
          "text": "Срок работы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-13-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 32,
          "text": "14 лет",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-14-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 33,
          "text": "Конкуренты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-14-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 34,
          "text": "Водная компания, Компания X, Мега Вода, Вода PRO,\nВодаМастер",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "general_information-15-label",
          "role": "fact-label",
          "sectionId": "general_information",
          "order": 35,
          "text": "Контрагенты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "general_information-15-value",
          "role": "fact-value",
          "sectionId": "general_information",
          "order": 36,
          "text": "ВодныйМИР, Спасатель, Поставка, МикроВода",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-title",
          "role": "section-title",
          "sectionId": "business_owners",
          "order": 37,
          "text": "Собственники бизнеса",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "business_owners-0-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 38,
          "text": "ФИО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-0-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 39,
          "text": "Доставалова Ирина Антоновна",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-1-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 40,
          "text": "Роль",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-1-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 41,
          "text": "Учредитель, Конечный бенефициар",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-2-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 42,
          "text": "Доля",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-2-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 43,
          "text": "100%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-3-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 44,
          "text": "Пакет услуг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-3-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 45,
          "text": "СберПервый",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-4-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 46,
          "text": "Инсайт 1",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-4-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 47,
          "text": "Одна из богатейших женщин Красноярска — купила два\nгектара земли и офисы на Калинина за 260 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "business_owners-5-label",
          "role": "fact-label",
          "sectionId": "business_owners",
          "order": 48,
          "text": "Инсайт 2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "business_owners-5-value",
          "role": "fact-value",
          "sectionId": "business_owners",
          "order": 49,
          "text": "Увлекается садоводством",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-title",
          "role": "section-title",
          "sectionId": "financial_indicators",
          "order": 50,
          "text": "Финансовые показатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "financial_indicators-0-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 51,
          "text": "Выручка, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-0-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 52,
          "text": "2 946,9",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-1-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 53,
          "text": "Выручка, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-1-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 54,
          "text": "2 598,8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-2-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 55,
          "text": "Динамика выручки",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-2-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 56,
          "text": "-11,8%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-3-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 57,
          "text": "EBITDA, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-3-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 58,
          "text": "190",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-4-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 59,
          "text": "EBITDA, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-4-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 60,
          "text": "125",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 1976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-5-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 61,
          "text": "Динамика EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-5-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 62,
          "text": "-35%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-6-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 63,
          "text": "Чистая прибыль, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-6-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 64,
          "text": "106,4",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-7-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 65,
          "text": "Чистая прибыль, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2136,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-7-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 66,
          "text": "66,2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2168,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-8-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 67,
          "text": "Динамика чистой прибыли",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2200,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-8-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 68,
          "text": "-38%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2232,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-9-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 69,
          "text": "Долг, млн руб., 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2264,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-9-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 70,
          "text": "223",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2296,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-10-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 71,
          "text": "Долг, млн руб., 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2328,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-10-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 72,
          "text": "183",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2360,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-11-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 73,
          "text": "Динамика долга",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2392,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-11-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 74,
          "text": "-40 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2424,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-12-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 75,
          "text": "Долг/EBITDA, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2456,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-12-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 76,
          "text": "1,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2488,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-13-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 77,
          "text": "Долг/EBITDA, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2520,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-13-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 78,
          "text": "1,6",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2552,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-14-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 79,
          "text": "Динамика долг/EBITDA",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2584,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-14-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 80,
          "text": "+0,3",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2616,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-15-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 81,
          "text": "Рентабельность продаж, 4Q 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2648,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-15-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 82,
          "text": "3,6%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2680,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-16-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 83,
          "text": "Рентабельность продаж, 2Q 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2712,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-16-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 84,
          "text": "2,5%",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2744,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-17-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 85,
          "text": "Динамика рентабельности продаж",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2776,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-17-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 86,
          "text": "-1,1 п.п.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2808,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "financial_indicators-18-label",
          "role": "fact-label",
          "sectionId": "financial_indicators",
          "order": 87,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2840,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "financial_indicators-18-value",
          "role": "fact-value",
          "sectionId": "financial_indicators",
          "order": 88,
          "text": "Компания испытывает финансовые трудности:\nснизились выручка, EBITDA, чистая прибыль и\nрентабельность продаж; долговая нагрузка\nухудшилась несмотря на снижение долга на 40 млн\nруб. Рекомендуются меры по восстановлению\nустойчивости и конкурентоспособности.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2872,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-title",
          "role": "section-title",
          "sectionId": "cooperation",
          "order": 89,
          "text": "Сотрудничество",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2904,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "cooperation-0-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 90,
          "text": "Количество продуктов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2936,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-0-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 91,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 2968,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-1-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 92,
          "text": "ОД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3000,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-1-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 93,
          "text": "35",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3032,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-2-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 94,
          "text": "ОД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3064,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-2-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 95,
          "text": "52",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3096,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-3-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 96,
          "text": "Динамика ОД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3128,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-3-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 97,
          "text": "+17; положительная динамика, общий доход вырос за\nсчёт НКД и активов",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3160,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-4-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 98,
          "text": "СДО Активы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3192,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-4-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 99,
          "text": "1100",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3224,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-5-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 100,
          "text": "СДО Активы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3256,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-5-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 101,
          "text": "1 300",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3288,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-6-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 102,
          "text": "Динамика СДО Активы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3320,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-6-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 103,
          "text": "+200; рост может отражать расширение деятельности\nили вложения в новые проекты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3352,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-7-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 104,
          "text": "СДО Пассивы, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3384,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-7-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 105,
          "text": "90",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3416,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-8-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 106,
          "text": "СДО Пассивы, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3448,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-8-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 107,
          "text": "115",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3480,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-9-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 108,
          "text": "Динамика СДО Пассивы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3512,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-9-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 109,
          "text": "+30; база в основном за счёт овернайта, остатки\nнестабильны",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3544,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-10-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 110,
          "text": "ФОТ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3576,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-10-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 111,
          "text": "17",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3608,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-11-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 112,
          "text": "ФОТ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3640,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-11-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 113,
          "text": "14",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3672,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-12-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 114,
          "text": "Динамика ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3704,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-12-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 115,
          "text": "-3; снижение может указывать на оптимизацию\nпроцессов, сокращение персонала или повышение\nэффективности",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3736,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-13-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 116,
          "text": "НКД, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3768,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-13-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 117,
          "text": "12",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3800,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-14-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 118,
          "text": "НКД, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3832,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-14-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 119,
          "text": "15",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3864,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-15-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 120,
          "text": "Динамика НКД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3896,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-15-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 121,
          "text": "+3; прирост в основном за счёт эквайринга и\nинкассации",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3928,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-16-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 122,
          "text": "Экосистема, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3960,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-16-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 123,
          "text": "7",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 3992,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-17-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 124,
          "text": "Экосистема, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4024,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-17-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 125,
          "text": "8",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4056,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-18-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 126,
          "text": "Динамика экосистемы",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4088,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-18-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 127,
          "text": "+1; представлены СберЗдоровье и СберМаркетинг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4120,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-19-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 128,
          "text": "ПФИ, млн руб., Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4152,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-19-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 129,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4184,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-20-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 130,
          "text": "ПФИ, млн руб., Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4216,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-20-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 131,
          "text": "2",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4248,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-21-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 132,
          "text": "Динамика ПФИ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4280,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-21-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 133,
          "text": "-; активности в направлении мало",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4312,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-22-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 134,
          "text": "Уникальные получатели, Авг 2024 — Июль 2025",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4344,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-22-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 135,
          "text": "45 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4376,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-23-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 136,
          "text": "Уникальные получатели, Авг 2025 — Июль 2026",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4408,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-23-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 137,
          "text": "80 человек",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4440,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "cooperation-24-label",
          "role": "fact-label",
          "sectionId": "cooperation",
          "order": 138,
          "text": "Динамика уникальных получателей",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4472,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "cooperation-24-value",
          "role": "fact-value",
          "sectionId": "cooperation",
          "order": 139,
          "text": "+35; позитивный сигнал расширения сотрудничества в\nчасти ФОТ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4504,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-title",
          "role": "section-title",
          "sectionId": "sber_share",
          "order": 140,
          "text": "Доля в Сбере",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4536,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "sber_share-0-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 141,
          "text": "Кошелёк, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4568,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-0-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 142,
          "text": "В Сбере 1250; в других банках 250; доля Сбера 83%;\nвсего 1500; банк-конкурент Открытие",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4600,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-1-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 143,
          "text": "Уникальные получатели",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4632,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-1-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 144,
          "text": "В Сбере 80; в других банках 10; доля Сбера 89%;\nвсего 90; конкуренты Открытие, ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4664,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-2-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 145,
          "text": "РКО, млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4696,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-2-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 146,
          "text": "В Сбере 750; в других банках 250; доля Сбера 75%;\nвсего 1000; конкуренты Открытие, ВТБ,\nРайффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4728,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-3-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 147,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4760,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-3-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 148,
          "text": "В Сбере 400; в других банках 200; доля Сбера 67%;\nвсего 600; конкурент Райффайзенбанк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4792,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-4-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 149,
          "text": "ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4824,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-4-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 150,
          "text": "В Сбере 700; в других банках 400; доля Сбера 64%;\nвсего 1100; конкуренты Открытие, ТКБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4856,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "sber_share-5-label",
          "role": "fact-label",
          "sectionId": "sber_share",
          "order": 151,
          "text": "Вывод",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4888,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "sber_share-5-value",
          "role": "fact-value",
          "sectionId": "sber_share",
          "order": 152,
          "text": "Есть несоответствие доли Сбера по сравнению с\nдолей в кредитном портфеле по РКО, эквайрингу и\nВЭД. Рекомендуется нарастить объёмы для достижения\nдоли 83%.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4920,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-title",
          "role": "section-title",
          "sectionId": "active_deals",
          "order": 153,
          "text": "Сделки в работе",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4952,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "active_deals-0-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 154,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 4984,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-0-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 155,
          "text": "1 млрд руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5016,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-1-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 156,
          "text": "Эквайринг",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5048,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-1-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 157,
          "text": "200 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5080,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "active_deals-2-label",
          "role": "fact-label",
          "sectionId": "active_deals",
          "order": 158,
          "text": "Инкассация",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5112,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "active_deals-2-value",
          "role": "fact-value",
          "sectionId": "active_deals",
          "order": 159,
          "text": "500 млн руб.",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5144,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-title",
          "role": "section-title",
          "sectionId": "potential",
          "order": 160,
          "text": "Потенциал",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5176,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "potential-0-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 161,
          "text": "Краткосрочное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5208,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-0-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 162,
          "text": "500 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5240,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "potential-1-label",
          "role": "fact-label",
          "sectionId": "potential",
          "order": 163,
          "text": "Телемедицина",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5272,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "potential-1-value",
          "role": "fact-value",
          "sectionId": "potential",
          "order": 164,
          "text": "5 млн",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5304,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-title",
          "role": "section-title",
          "sectionId": "preapproved_offers",
          "order": 165,
          "text": "Предодобренные предложения",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5336,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "preapproved_offers-0-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 166,
          "text": "Оборотное кредитование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5368,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-0-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 167,
          "text": "ВКЛ на 100 млн рублей до 36 мес",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5400,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "preapproved_offers-1-label",
          "role": "fact-label",
          "sectionId": "preapproved_offers",
          "order": 168,
          "text": "Банковские гарантии",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5432,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "preapproved_offers-1-value",
          "role": "fact-value",
          "sectionId": "preapproved_offers",
          "order": 169,
          "text": "Гарантии ИФНС на 500 млн руб до 12 мес;\nотклонение: верификация ОКК",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5464,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-title",
          "role": "section-title",
          "sectionId": "insights",
          "order": 170,
          "text": "Инсайты",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5496,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "insights-0-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 171,
          "text": "Альфа-Банк",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5528,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-0-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 172,
          "text": "Эквайринг 1,5% против 1,7% у Сбера; бесплатные КСО\nс абонплатой 5 000 ₽",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5560,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-1-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 173,
          "text": "ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5592,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-1-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 174,
          "text": "Предложили эквайринг 1,7% без НДС",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5624,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-2-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 175,
          "text": "Открытие и ВТБ",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5656,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-2-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 176,
          "text": "Уже занимают часть ФОТ и ВЭД",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5688,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "insights-3-label",
          "role": "fact-label",
          "sectionId": "insights",
          "order": 177,
          "text": "Отношение клиента",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5720,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "insights-3-value",
          "role": "fact-value",
          "sectionId": "insights",
          "order": 178,
          "text": "Клиент называет зарплатный проект Сбера «скучным и\nневыгодным»",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5752,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-title",
          "role": "section-title",
          "sectionId": "meeting_agreements",
          "order": 179,
          "text": "Договорённости с последней встречи",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5784,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 700,
            "fill": "#202633"
          }
        },
        {
          "id": "meeting_agreements-0-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 180,
          "text": "Поставщики",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5816,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-0-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 181,
          "text": "Поиск альтернативных поставщиков оборудования из\nИндии по сниженной цене",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5848,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-1-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 182,
          "text": "КСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5880,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-1-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 183,
          "text": "Консультация технических специалистов по внедрению\nКСО",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5912,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-2-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 184,
          "text": "Валютное хеджирование",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5944,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-2-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 185,
          "text": "Предоставление информации и поддержки по валютному\nхеджированию",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 5976,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "meeting_agreements-3-label",
          "role": "fact-label",
          "sectionId": "meeting_agreements",
          "order": 186,
          "text": "ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6008,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 13,
            "fontWeight": 600,
            "fill": "#5e687a"
          }
        },
        {
          "id": "meeting_agreements-3-value",
          "role": "fact-value",
          "sectionId": "meeting_agreements",
          "order": 187,
          "text": "Получение ясности по срокам кредита от ФРП",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6040,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 14,
            "fontWeight": 400,
            "fill": "#252c39"
          }
        },
        {
          "id": "create-presentation",
          "role": "primary-action",
          "sectionId": "primary-action",
          "order": 188,
          "text": "Создать презентацию по справке",
          "copyId": "button_label",
          "action": null,
          "tone": "disabled",
          "layout": {
            "x": 24,
            "y": 6072,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 17,
            "fontWeight": 700,
            "fill": "#ffffff"
          }
        },
        {
          "id": "generation-started",
          "role": "system-message",
          "sectionId": "messages",
          "order": 189,
          "text": "Формирование презентации началось в 13:24 и\nзаймет не более 20 минут. После завершения\nпрезентация будет направлена по электронной\nпочте в SIGMA и OMEGA.",
          "copyId": "generation_started_message",
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6104,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#5d687e"
          }
        },
        {
          "id": "delivery-unconfirmed",
          "role": "error-message",
          "sectionId": "messages",
          "order": 190,
          "text": "Презентация сформирована, но отправка по\nэлектронной почте в SIGMA и OMEGA не\nподтверждена. Задача передана в\nсопровождение.",
          "copyId": "delivery_full_failure_message",
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6136,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 15,
            "fontWeight": 400,
            "fill": "#5d687e"
          }
        },
        {
          "id": "composer-placeholder",
          "role": "composer-placeholder",
          "sectionId": "composer",
          "order": 191,
          "text": "Задайте любой вопрос…",
          "copyId": null,
          "action": null,
          "tone": "default",
          "layout": {
            "x": 24,
            "y": 6168,
            "width": 0,
            "height": 0
          },
          "style": {
            "fontSize": 16,
            "fontWeight": 400,
            "fill": "#9da6b8"
          }
        }
      ],
      "sourceSha256": "0ae5a817fe9a7dda4cfabdeaab37e7dc6240ff05b03ed5c2da478999ec429766"
    }
  ],
  "externalStates": [
    {
      "id": "lisa-presentation-email",
      "kind": "external",
      "contentType": "email",
      "pageCount": 1,
      "assetFormat": "svg",
      "assetPaths": [
        "assets/external/lisa-presentation-email.svg"
      ],
      "intrinsicPage": {
        "width": 1280,
        "height": 960
      }
    },
    {
      "id": "lisa-presentation-slidedoc",
      "kind": "external",
      "contentType": "presentation",
      "pageCount": 3,
      "assetFormat": "png",
      "assetPaths": [
        "assets/external/lisa-presentation-slidedoc-page-1.png",
        "assets/external/lisa-presentation-slidedoc-page-2.png",
        "assets/external/lisa-presentation-slidedoc-page-3.png"
      ],
      "intrinsicPage": {
        "width": 3840,
        "height": 2160
      }
    },
    {
      "id": "lisa-presentation-sber2025",
      "kind": "external",
      "contentType": "presentation",
      "pageCount": 3,
      "assetFormat": "png",
      "assetPaths": [
        "assets/external/lisa-presentation-sber2025-page-1.png",
        "assets/external/lisa-presentation-sber2025-page-2.png",
        "assets/external/lisa-presentation-sber2025-page-3.png"
      ],
      "intrinsicPage": {
        "width": 3840,
        "height": 2160
      }
    },
    {
      "id": "lisa-presentation-mag",
      "kind": "external",
      "contentType": "presentation",
      "pageCount": 3,
      "assetFormat": "png",
      "assetPaths": [
        "assets/external/lisa-presentation-mag-page-1.png",
        "assets/external/lisa-presentation-mag-page-2.png",
        "assets/external/lisa-presentation-mag-page-3.png"
      ],
      "intrinsicPage": {
        "width": 3840,
        "height": 2160
      }
    }
  ]
};
